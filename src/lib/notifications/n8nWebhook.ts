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
    const settings = await getNotificationSettings(barbershopId);
    
    if (!settings?.n8n_webhook_url) {
      console.log("Email webhook not configured");
      return false;
    }

    const payload = {
      type: "test_notification",
      barbershop_name: barbershopName,
      client_name: "Cliente Teste",
      client_email: "teste@exemplo.com",
      client_phone: "",
      service_name: "Serviço de Teste",
      service_price: 50.00,
      professional_name: "Profissional Teste",
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: "14:00",
      notes: "Esta é uma notificação de teste",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending test email notification to n8n webhook");
    
    await fetch(settings.n8n_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    console.log("Test email notification sent to n8n");
    return true;
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
    const { data, error } = await supabase
      .from("barbershop_settings")
      .select("n8n_whatsapp_webhook_url, whatsapp_enabled")
      .eq("barbershop_id", barbershopId)
      .single();

    if (error || !data?.n8n_whatsapp_webhook_url || !data?.whatsapp_enabled) {
      console.log("WhatsApp webhook not configured or disabled");
      return false;
    }

    // Use the edge function to send via webhook
    const { error: fnError } = await supabase.functions.invoke("send-whatsapp-webhook", {
      body: {
        barbershopId,
        phone: "test",
        message: `🧪 *Teste de Notificação*\n\nOlá! Esta é uma mensagem de teste do sistema de notificações da *${barbershopName}*.\n\n✅ Tudo funcionando corretamente!`,
        isTest: true,
      },
    });

    if (fnError) {
      console.error("Error sending test WhatsApp notification:", fnError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending test WhatsApp notification:", error);
    return false;
  }
}
