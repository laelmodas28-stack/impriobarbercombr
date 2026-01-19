import { supabase } from "@/integrations/supabase/client";

interface SendMessageParams {
  barbershopId: string;
  phone: string;
  message: string;
}

interface BookingNotificationParams {
  barbershopId: string;
  barbershopName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  professionalName: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string;
}

export interface ConnectionStatus {
  state: "open" | "close" | "connecting" | "connected" | "disconnected" | "error" | string;
  message?: string;
  phoneNumber?: string;
}

interface EvolutionApiSettings {
  whatsapp_enabled: boolean;
  whatsapp_send_booking_confirmation: boolean;
  whatsapp_send_booking_reminder: boolean;
}

export async function getWhatsAppSettings(barbershopId: string): Promise<EvolutionApiSettings | null> {
  const { data, error } = await supabase
    .from("barbershop_settings")
    .select(`
      whatsapp_enabled,
      whatsapp_send_booking_confirmation,
      whatsapp_send_booking_reminder
    `)
    .eq("barbershop_id", barbershopId)
    .single();

  if (error) {
    console.error("Error fetching WhatsApp settings:", error);
    return null;
  }

  return data as EvolutionApiSettings;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Add Brazil country code if not present
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

export async function sendWhatsAppMessage({ barbershopId, phone, message }: SendMessageParams): Promise<boolean> {
  const settings = await getWhatsAppSettings(barbershopId);
  
  if (!settings || !settings.whatsapp_enabled) {
    console.log("WhatsApp not enabled for this barbershop");
    return false;
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
      body: {
        barbershopId,
        phone: formattedPhone,
        message,
      },
    });

    if (error) {
      console.error("Error sending WhatsApp message:", error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

export async function sendBookingConfirmationWhatsApp(params: BookingNotificationParams): Promise<boolean> {
  const settings = await getWhatsAppSettings(params.barbershopId);
  
  if (!settings?.whatsapp_enabled || !settings?.whatsapp_send_booking_confirmation) {
    return false;
  }

  if (!params.clientPhone) {
    console.log("No phone number provided for WhatsApp notification");
    return false;
  }

  const formattedDate = new Date(params.bookingDate + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const message = `✅ *Agendamento Confirmado!*

Olá ${params.clientName}! 👋

Seu agendamento na *${params.barbershopName}* foi confirmado:

📋 *Serviço:* ${params.serviceName}
💇 *Profissional:* ${params.professionalName}
📅 *Data:* ${formattedDate}
⏰ *Horário:* ${params.bookingTime}
💰 *Valor:* R$ ${params.servicePrice.toFixed(2)}
${params.notes ? `\n📝 *Obs:* ${params.notes}` : ""}

Esperamos você! 😊`;

  return sendWhatsAppMessage({
    barbershopId: params.barbershopId,
    phone: params.clientPhone,
    message,
  });
}

export async function sendBookingReminderWhatsApp(params: BookingNotificationParams): Promise<boolean> {
  const settings = await getWhatsAppSettings(params.barbershopId);
  
  if (!settings?.whatsapp_enabled || !settings?.whatsapp_send_booking_reminder) {
    return false;
  }

  if (!params.clientPhone) {
    return false;
  }

  const formattedDate = new Date(params.bookingDate + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const message = `⏰ *Lembrete de Agendamento*

Olá ${params.clientName}! 👋

Este é um lembrete do seu agendamento na *${params.barbershopName}*:

📋 *Serviço:* ${params.serviceName}
💇 *Profissional:* ${params.professionalName}
📅 *Data:* ${formattedDate}
⏰ *Horário:* ${params.bookingTime}

Contamos com sua presença! 😊

_Caso precise cancelar ou reagendar, entre em contato conosco._`;

  return sendWhatsAppMessage({
    barbershopId: params.barbershopId,
    phone: params.clientPhone,
    message,
  });
}
