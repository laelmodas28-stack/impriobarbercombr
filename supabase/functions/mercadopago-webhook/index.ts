import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mercadopagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

    if (!mercadopagoToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook data
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    // Also try to get from body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty for some notifications
    }

    const paymentId = id || body?.data?.id;
    const type = topic || body?.type;

    console.log('Webhook received:', { type, paymentId, body });

    if (type !== 'payment' || !paymentId) {
      console.log('Ignoring non-payment notification');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Fetch payment details from Mercado Pago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${mercadopagoToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment:', await paymentResponse.text());
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const payment = await paymentResponse.json();
    console.log('Payment details:', JSON.stringify(payment, null, 2));

    const preferenceId = payment.preference_id;
    const status = payment.status; // approved, pending, rejected, cancelled, etc.
    const paymentMethod = payment.payment_type_id; // credit_card, pix, boleto, etc.

    // Parse external_reference
    let externalRef: { planId?: string; barbershopId?: string; userId?: string } = {};
    try {
      externalRef = JSON.parse(payment.external_reference || '{}');
    } catch {
      console.error('Failed to parse external_reference');
    }

    const { planId, barbershopId, userId } = externalRef;

    if (!planId || !barbershopId || !userId) {
      console.error('Missing external reference data');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Update transaction record
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        transaction_id: String(paymentId),
        status: status === 'approved' ? 'completed' : status,
        mercadopago_status: status,
        payment_method: paymentMethod,
        raw_response: payment,
        updated_at: new Date().toISOString(),
      })
      .eq('preference_id', preferenceId);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
    }

    // If payment is approved, create or update subscription
    if (status === 'approved') {
      console.log('Payment approved, creating subscription...');

      // Fetch plan to get duration
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', planId)
        .single();

      const startDate = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (plan?.duration_days || 30));

      // Check for existing subscription
      const { data: existingSub } = await supabase
        .from('client_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('barbershop_id', barbershopId)
        .eq('status', 'active')
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error: subError } = await supabase
          .from('client_subscriptions')
          .update({
            plan_id: planId,
            expires_at: expiresAt.toISOString(),
            payment_method: paymentMethod,
            transaction_id: String(paymentId),
            mercadopago_preference_id: preferenceId,
          })
          .eq('id', existingSub.id);

        if (subError) {
          console.error('Failed to update subscription:', subError);
        } else {
          console.log('Subscription updated successfully');
        }
      } else {
        // Create new subscription
        const { error: subError } = await supabase
          .from('client_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            barbershop_id: barbershopId,
            started_at: startDate.toISOString(),
            expires_at: expiresAt.toISOString(),
            status: 'active',
            payment_method: paymentMethod,
            transaction_id: String(paymentId),
            mercadopago_preference_id: preferenceId,
          });

        if (subError) {
          console.error('Failed to create subscription:', subError);
        } else {
          console.log('Subscription created successfully');
        }
      }

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          barbershop_id: barbershopId,
          title: 'Assinatura Ativada! 🎉',
          message: 'Seu pagamento foi confirmado e sua assinatura está ativa.',
          type: 'success',
        });
    } else if (status === 'rejected' || status === 'cancelled') {
      // Create notification for failed payment
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          barbershop_id: barbershopId,
          title: 'Pagamento não aprovado',
          message: 'Houve um problema com seu pagamento. Tente novamente.',
          type: 'error',
        });
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
