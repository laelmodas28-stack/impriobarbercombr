import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Schema validation (code temporarily optional)
    const registerSchema = z.object({
      code: z.string().min(6).max(50).optional(),
      owner: z.object({
        email: z.string().email().max(255),
        password: z.string().min(6).max(100),
        full_name: z.string().min(2).max(100).trim(),
        phone: z.string().regex(/^\d{10,15}$/).optional()
      }),
      barbershop: z.object({
        name: z.string().min(2).max(100).trim(),
        address: z.string().max(200).optional(),
        description: z.string().max(500).optional()
      })
    });

    const body = await req.json();
    const validatedData = registerSchema.parse(body);
    const { code, owner, barbershop } = validatedData;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate registration code only if provided (temporarily optional)
    let codeData = null;
    if (code && code.length > 0) {
      const { data, error: codeError } = await supabaseAdmin
        .from('registration_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .maybeSingle();

      if (codeError || !data) {
        return new Response(
          JSON.stringify({ error: 'Código de acesso inválido ou já utilizado' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      // Check if code is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Código de acesso expirado' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      codeData = data;
      console.log('Registration with access code:', code);
    } else {
      console.log('Registration without access code (temporary mode)');
    }

    console.log('Starting barbershop registration for:', owner.email);

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner.email,
      password: owner.password,
      email_confirm: true,
      user_metadata: {
        full_name: owner.full_name,
        phone: owner.phone,
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log('User created:', userId);

    // 2. Update profile to admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // 3. Create barbershop
    const { data: barbershopData, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .insert({
        name: barbershop.name,
        owner_id: userId,
        address: barbershop.address,
        description: barbershop.description,
        phone: owner.phone,
        whatsapp: owner.phone,
      })
      .select()
      .single();

    if (barbershopError) {
      console.error('Error creating barbershop:', barbershopError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar barbearia: ' + barbershopError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const barbershopId = barbershopData.id;
    console.log('Barbershop created:', barbershopId);

    // 4. Create user_role (admin)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        barbershop_id: barbershopId,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
    }

    // 5. Create default notification_settings
    const { error: notificationError } = await supabaseAdmin
      .from('notification_settings')
      .insert({
        barbershop_id: barbershopId,
        enabled: true,
        send_to_client: true,
        send_whatsapp: false,
        ai_enabled: true,
        custom_message: 'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora}. Serviço: {servico}. Profissional: {profissional}. Aguardamos você!',
        admin_whatsapp: owner.phone,
      });

    if (notificationError) {
      console.error('Error creating notification settings:', notificationError);
    }

    // 6. Mark registration code as used (only if code was provided)
    if (code && code.length > 0 && codeData) {
      const { error: codeUpdateError } = await supabaseAdmin
        .from('registration_codes')
        .update({ 
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString()
        })
        .eq('code', code);

      if (codeUpdateError) {
        console.error('Error updating registration code:', codeUpdateError);
      }
    }

    // Enviar webhook para n8n com dados de acesso
    const webhookUrl = 'https://n8nwebhook.atendai.app/webhook/23f78ce8-d4c4-4ce3-bff4-374701a008a1';
    const baseUrl = 'https://impriobarbercombr.lovable.app';

    try {
      const webhookPayload = {
        event: 'barbershop_registered',
        timestamp: new Date().toISOString(),
        barbershop: {
          id: barbershopId,
          name: barbershop.name,
          slug: barbershopData.slug,
          address: barbershop.address || null,
          description: barbershop.description || null
        },
        owner: {
          id: userId,
          email: owner.email,
          full_name: owner.full_name,
          phone: owner.phone || null
        },
        access_urls: {
          barbershop_page: `${baseUrl}/b/${barbershopData.slug}`,
          admin_panel: `${baseUrl}/b/${barbershopData.slug}/admin`,
          login_page: `${baseUrl}/b/${barbershopData.slug}/auth`
        }
      };

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log('Webhook enviado para n8n:', webhookResponse.status);
    } catch (webhookError) {
      console.error('Erro ao enviar webhook (não crítico):', webhookError);
      // Não falha o registro se webhook falhar
    }

    console.log('Barbershop registration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        barbershop_id: barbershopId,
        slug: barbershopData.slug,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in register-barbershop function:', error);
    
    // Handle zod validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos: ' + error.errors[0].message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});