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
