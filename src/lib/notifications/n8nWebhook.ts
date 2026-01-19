import { supabase } from "@/integrations/supabase/client";

interface BookingNotificationData {
  barbershopId: string;
  barbershopName: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  servicePrice: number;
  professionalName: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string | null;
}

interface N8nSettings {
  n8n_webhook_url: string | null;
  send_booking_confirmation: boolean | null;
  send_booking_reminder: boolean | null;
}

/**
 * Fetches notification settings for a barbershop
 */
export async function getNotificationSettings(barbershopId: string): Promise<N8nSettings | null> {
  const { data, error } = await supabase
    .from("barbershop_settings")
    .select("n8n_webhook_url, send_booking_confirmation, send_booking_reminder")
    .eq("barbershop_id", barbershopId)
    .single();

  if (error) {
    console.error("Error fetching notification settings:", error);
    return null;
  }

  return data as N8nSettings;
}

/**
 * Sends a booking confirmation notification via n8n webhook
 */
export async function sendBookingConfirmationViaWebhook(
  data: BookingNotificationData
): Promise<boolean> {
  try {
    const settings = await getNotificationSettings(data.barbershopId);
    
    if (!settings?.n8n_webhook_url || !settings.send_booking_confirmation) {
      console.log("Webhook not configured or confirmations disabled");
      return false;
    }

    const payload = {
      type: "booking_confirmation",
      barbershop_name: data.barbershopName,
      client_name: data.clientName,
      client_email: data.clientEmail || "",
      client_phone: data.clientPhone || "",
      service_name: data.serviceName,
      service_price: data.servicePrice,
      professional_name: data.professionalName,
      booking_date: data.bookingDate,
      booking_time: data.bookingTime,
      notes: data.notes || "",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending booking confirmation to n8n webhook:", settings.n8n_webhook_url);
    
    // Using no-cors because n8n webhooks don't return proper CORS headers by default
    await fetch(settings.n8n_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    console.log("Booking confirmation sent to n8n");
    return true;
  } catch (error) {
    console.error("Error sending booking confirmation via webhook:", error);
    return false;
  }
}

/**
 * Sends a booking reminder notification via n8n webhook
 */
export async function sendBookingReminderViaWebhook(
  data: BookingNotificationData
): Promise<boolean> {
  try {
    const settings = await getNotificationSettings(data.barbershopId);
    
    if (!settings?.n8n_webhook_url || !settings.send_booking_reminder) {
      console.log("Webhook not configured or reminders disabled");
      return false;
    }

    const payload = {
      type: "booking_reminder",
      barbershop_name: data.barbershopName,
      client_name: data.clientName,
      client_email: data.clientEmail || "",
      client_phone: data.clientPhone || "",
      service_name: data.serviceName,
      service_price: data.servicePrice,
      professional_name: data.professionalName,
      booking_date: data.bookingDate,
      booking_time: data.bookingTime,
      notes: data.notes || "",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending booking reminder to n8n webhook:", settings.n8n_webhook_url);
    
    await fetch(settings.n8n_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    console.log("Booking reminder sent to n8n");
    return true;
  } catch (error) {
    console.error("Error sending booking reminder via webhook:", error);
    return false;
  }
}

/**
 * Sends a test notification via n8n webhook (email)
 */
export async function sendTestEmailNotification(barbershopId: string, barbershopName: string): Promise<boolean> {
  try {
    const now = new Date();
    const bookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    const payload = {
      type: "test_email_notification",
      // Barbershop info
      barbershop_id: barbershopId,
      barbershop_name: barbershopName,
      // Client info
      client_name: "Cliente Teste",
      client_email: "cliente.teste@exemplo.com",
      // Professional info
      professional_name: "Barbeiro Teste",
      professional_email: "barbeiro.teste@exemplo.com",
      // Booking info
      service_name: "Corte de Cabelo",
      service_price: 45.00,
      booking_date: bookingDate.toISOString().split('T')[0],
      booking_time: "14:00",
      // Dates
      registration_date: now.toISOString(),
      access_date: now.toISOString(),
      // HTML Template
      email_template: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Agendamento</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: bold;">${barbershopName}</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Sistema de Agendamentos</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 22px;">🧪 Notificação de Teste</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Esta é uma mensagem de teste do sistema de notificações por e-mail.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <tr>
            <td style="padding: 10px;">
              <p style="margin: 0; color: #333;"><strong>📅 Data:</strong> ${bookingDate.toLocaleDateString('pt-BR')}</p>
              <p style="margin: 10px 0 0 0; color: #333;"><strong>⏰ Horário:</strong> 14:00</p>
              <p style="margin: 10px 0 0 0; color: #333;"><strong>✂️ Serviço:</strong> Corte de Cabelo</p>
              <p style="margin: 10px 0 0 0; color: #333;"><strong>💰 Valor:</strong> R$ 45,00</p>
              <p style="margin: 10px 0 0 0; color: #333;"><strong>👤 Profissional:</strong> Barbeiro Teste</p>
            </td>
          </tr>
        </table>
        <p style="color: #28a745; font-size: 14px; text-align: center; margin: 20px 0;">
          ✅ Sistema de notificações funcionando corretamente!
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <p style="color: #888888; font-size: 12px; margin: 0;">
          © ${now.getFullYear()} ${barbershopName}. Todos os direitos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
      notes: "Esta é uma notificação de teste",
    };

    // Send to edge function which forwards to n8n webhook using the secret
    const { data, error } = await supabase.functions.invoke("send-email-webhook", {
      body: {
        barbershopId,
        payload,
        isTest: true,
      },
    });

    if (error) {
      console.error("Error sending test email notification:", error);
      return false;
    }

    console.log("Test email notification sent to n8n", data);
    return data?.success ?? false;
  } catch (error) {
    console.error("Error sending test email notification:", error);
    return false;
  }
}

/**
 * Sends a test notification via n8n webhook (WhatsApp)
 */
export async function sendTestWhatsAppNotification(barbershopId: string, barbershopName: string): Promise<boolean> {
  try {
    const now = new Date();
    const bookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    const payload = {
      type: "test_whatsapp_notification",
      is_test: true,
      // Barbershop info
      barbershop_id: barbershopId,
      barbershop_name: barbershopName,
      // Client info (normalized phone with +55)
      client_name: "Cliente Teste",
      client_phone: "+5511999999999",
      // Professional info
      professional_name: "Barbeiro Teste",
      professional_phone: "+5511988888888",
      // Booking info
      service_name: "Corte de Cabelo",
      service_price: 45.00,
      booking_date: bookingDate.toISOString().split('T')[0],
      booking_time: "14:00",
      // Dates
      registration_date: now.toISOString(),
      access_date: now.toISOString(),
      // WhatsApp Message Template
      message_template: `🧪 *TESTE DE NOTIFICAÇÃO*

Olá! Esta é uma mensagem de teste do sistema de notificações da *${barbershopName}*.

📋 *Detalhes do Agendamento (Exemplo):*
━━━━━━━━━━━━━━━━━━━━━
📅 *Data:* ${bookingDate.toLocaleDateString('pt-BR')}
⏰ *Horário:* 14:00
✂️ *Serviço:* Corte de Cabelo
💰 *Valor:* R$ 45,00
👤 *Profissional:* Barbeiro Teste
━━━━━━━━━━━━━━━━━━━━━

✅ Sistema de notificações funcionando corretamente!

_Esta é uma mensagem automática de teste._`,
      notes: "Esta é uma notificação de teste",
      timestamp: now.toISOString(),
    };

    // Send to edge function which forwards to n8n webhook using the secret
    const { data, error } = await supabase.functions.invoke("send-whatsapp-webhook", {
      body: {
        barbershopId,
        phone: "+5511999999999",
        message: payload.message_template,
        isTest: true,
        payload, // Full payload for n8n processing
      },
    });

    if (error) {
      console.error("Error sending test WhatsApp notification:", error);
      return false;
    }

    console.log("Test WhatsApp notification sent to n8n", data);
    return data?.success ?? false;
  } catch (error) {
    console.error("Error sending test WhatsApp notification:", error);
    return false;
  }
}
