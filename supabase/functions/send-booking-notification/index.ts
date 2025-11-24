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
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  date: string;
  time: string;
  service: string;
  professional: string;
  price: number;
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
      clientEmail,
      clientName,
      clientPhone,
      date,
      time,
      service,
      professional,
      price,
    }: NotificationRequest = await req.json();

    console.log("Processing notification for:", clientEmail);

    // Buscar configurações de notificação
    const { data: barbershopInfo } = await supabase
      .from("barbershop_info")
      .select("*")
      .single();

    const { data: notificationSettings } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

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

              ${barbershopInfo?.whatsapp ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://wa.me/${barbershopInfo.whatsapp.replace(/\D/g, '')}" 
                     style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    💬 Entrar em Contato via WhatsApp
                  </a>
                </div>
              ` : ''}

              ${barbershopInfo?.address ? `
                <p style="text-align: center; color: #666;">
                  📍 ${barbershopInfo.address}
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este é um email automático. Caso precise de ajuda, entre em contato conosco.</p>
              <p>${barbershopInfo?.name || 'Barbearia'}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: "Barbearia <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `✅ Agendamento Confirmado - ${formattedDate} às ${time}`,
        html: emailHtml,
      });

      console.log("Email sent to client:", clientEmail);
    }

    // Enviar email para o admin
    if (notificationSettings.admin_email) {
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

      await resend.emails.send({
        from: "Notificações <onboarding@resend.dev>",
        to: [notificationSettings.admin_email],
        subject: `Novo Agendamento - ${clientName} - ${formattedDate}`,
        html: adminEmailHtml,
      });

      console.log("Email sent to admin:", notificationSettings.admin_email);
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
