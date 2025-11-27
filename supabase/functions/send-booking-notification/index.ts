import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  bookingId: string;
  barbershopId: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  date: string;
  time: string;
  service: string;
  professional: string;
  price: number;
}

// Função para enviar SMS usando diferentes provedores
async function sendSMS(
  provider: string,
  apiKey: string,
  from: string,
  to: string,
  message: string
): Promise<void> {
  console.log(`Sending SMS via ${provider} to ${to}`);
  
  if (provider === 'vonage') {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey.split(':')[0],
        api_secret: apiKey.split(':')[1],
        from,
        to: to.replace(/\D/g, ''),
        text: message,
      }),
    });
    const data = await response.json();
    if (data.messages[0].status !== '0') {
      throw new Error(`Vonage SMS failed: ${data.messages[0]['error-text']}`);
    }
  } else if (provider === 'messagebird') {
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originator: from,
        recipients: [to.replace(/\D/g, '')],
        body: message,
      }),
    });
    if (!response.ok) {
      throw new Error(`MessageBird SMS failed: ${response.statusText}`);
    }
  }
  // Adicione mais provedores conforme necessário
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      barbershopId,
      clientEmail,
      clientName,
      clientPhone,
      date,
      time,
      service,
      professional,
      price,
    }: NotificationRequest = await req.json();

    console.log("Processing notification for:", clientEmail, "Barbershop:", barbershopId);

    // Buscar dados da barbearia
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("*")
      .eq("id", barbershopId)
      .single();

    // Buscar configurações de notificação da barbearia específica
    const { data: notificationSettings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (!notificationSettings?.enabled) {
      console.log("Notifications disabled");
      return new Response(
        JSON.stringify({ message: "Notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatar data
    const formattedDate = new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Substituir variáveis na mensagem
    let customMessage = notificationSettings.custom_message || "";
    customMessage = customMessage
      .replace("{nome}", clientName)
      .replace("{data}", formattedDate)
      .replace("{hora}", time)
      .replace("{servico}", service)
      .replace("{profissional}", professional);

    // Enviar email para o cliente
    if (notificationSettings.send_to_client) {
      try {
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .message-box { background: #e8eaf6; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Agendamento Confirmado!</h1>
            </div>
            <div class="content">
              <div class="message-box">
                <p>${customMessage}</p>
              </div>
              
              <div class="details">
                <h2 style="color: #667eea; margin-top: 0;">📋 Detalhes do Agendamento</h2>
                <div class="detail-row">
                  <span class="detail-label">📅 Data:</span>
                  <span>${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Horário:</span>
                  <span>${time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">✂️ Serviço:</span>
                  <span>${service}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">👤 Profissional:</span>
                  <span>${professional}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Valor:</span>
                  <span>R$ ${price.toFixed(2)}</span>
                </div>
              </div>

              ${barbershop?.whatsapp ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://wa.me/${barbershop.whatsapp.replace(/\D/g, '')}" 
                     style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    💬 Entrar em Contato via WhatsApp
                  </a>
                </div>
              ` : ''}

              ${barbershop?.address ? `
                <p style="text-align: center; color: #666;">
                  📍 ${barbershop.address}
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este é um email automático. Caso precise de ajuda, entre em contato conosco.</p>
              <p>${barbershop?.name || 'Barbearia'}</p>
            </div>
          </div>
        </body>
        </html>
      `;

        const emailResponse = await resend.emails.send({
          from: "Barbearia <onboarding@resend.dev>",
          to: [clientEmail],
          subject: `✅ Agendamento Confirmado - ${formattedDate} às ${time}`,
          html: emailHtml,
        });

        console.log("✅ Email enviado para cliente:", clientEmail, "Response:", JSON.stringify(emailResponse));
      } catch (emailError: any) {
        console.error("❌ ERRO ao enviar email para cliente:", clientEmail, "Error:", emailError.message);
        throw emailError; // Re-throw para capturar no catch principal
      }
    }

    // Enviar email para o admin
    if (notificationSettings.admin_email) {
      try {
        const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 Novo Agendamento Recebido</h2>
            </div>
            <div class="content">
              <div class="details">
                <p><strong>Cliente:</strong> ${clientName}</p>
                <p><strong>Email:</strong> ${clientEmail}</p>
                ${clientPhone ? `<p><strong>Telefone:</strong> ${clientPhone}</p>` : ''}
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Horário:</strong> ${time}</p>
                <p><strong>Serviço:</strong> ${service}</p>
                <p><strong>Profissional:</strong> ${professional}</p>
                <p><strong>Valor:</strong> R$ ${price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

        const adminEmailResponse = await resend.emails.send({
          from: "Notificações <onboarding@resend.dev>",
          to: [notificationSettings.admin_email],
          subject: `Novo Agendamento - ${clientName} - ${formattedDate}`,
          html: adminEmailHtml,
        });

        console.log("✅ Email enviado para admin:", notificationSettings.admin_email, "Response:", JSON.stringify(adminEmailResponse));
      } catch (adminEmailError: any) {
        console.error("❌ ERRO ao enviar email para admin:", notificationSettings.admin_email, "Error:", adminEmailError.message);
        // Não fazer throw aqui, continuar com SMS se configurado
      }
    }

    // Enviar SMS para o cliente
    if (notificationSettings.send_sms && clientPhone) {
      if (!notificationSettings.sms_provider || !notificationSettings.sms_api_key) {
        console.warn("⚠️ SMS está habilitado mas faltam configurações. Provider:", notificationSettings.sms_provider, "API Key configurada:", !!notificationSettings.sms_api_key);
      } else {
        try {
          const smsMessage = customMessage.substring(0, 160); // Limitar a 160 caracteres
          await sendSMS(
            notificationSettings.sms_provider,
            notificationSettings.sms_api_key,
            notificationSettings.sms_from_number || 'Barbearia',
            clientPhone,
            smsMessage
          );
          console.log("✅ SMS enviado para cliente:", clientPhone);
        } catch (smsError: any) {
          console.error("❌ ERRO ao enviar SMS:", smsError.message);
          // Não falhar toda a notificação se SMS falhar
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
