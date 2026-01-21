import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "confirmation" | "cancellation" | "reminder";

interface BookingNotificationData {
  bookingId: string;
  barbershopId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceName: string;
  professionalName: string;
  bookingDate: string;
  bookingTime: string;
  price?: number;
  notificationType: NotificationType;
}

/**
 * Sends booking notifications via both Email and WhatsApp webhooks
 * This is the centralized function for all booking-related notifications:
 * - Confirmation (new booking)
 * - Cancellation (booking cancelled)
 * - Reminder (upcoming booking)
 */
export async function sendBookingNotifications(data: BookingNotificationData): Promise<{
  emailSent: boolean;
  whatsappSent: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailSent = false;
  let whatsappSent = false;

  // Fetch barbershop settings to check enabled channels
  const { data: settings } = await supabase
    .from("barbershop_settings")
    .select("*")
    .eq("barbershop_id", data.barbershopId)
    .single();

  // Fetch barbershop slug for WhatsApp instance name
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("slug, name")
    .eq("id", data.barbershopId)
    .single();

  const instanceName = barbershop?.slug || `barbershop-${data.barbershopId.substring(0, 8)}`;
  const barbershopName = barbershop?.name || "Barbearia";

  // Build notification type label
  const typeLabels: Record<NotificationType, string> = {
    confirmation: "Confirmação de Agendamento",
    cancellation: "Cancelamento de Agendamento",
    reminder: "Lembrete de Agendamento",
  };

  const triggerEvents: Record<NotificationType, string> = {
    confirmation: "booking_confirmed",
    cancellation: "booking_cancelled",
    reminder: "booking_reminder",
  };

  // Fetch templates for this notification type
  const { data: templates } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("barbershop_id", data.barbershopId)
    .eq("trigger_event", triggerEvents[data.notificationType])
    .eq("is_active", true);

  const emailTemplate = templates?.find((t) => t.type === "email");
  const whatsappTemplate = templates?.find((t) => t.type === "whatsapp");

  // Replace placeholders in template
  const replacePlaceholders = (content: string): string => {
    return content
      .replace(/\{\{cliente_nome\}\}/g, data.clientName)
      .replace(/\{\{servico_nome\}\}/g, data.serviceName)
      .replace(/\{\{profissional_nome\}\}/g, data.professionalName)
      .replace(/\{\{data_agendamento\}\}/g, data.bookingDate)
      .replace(/\{\{horario_agendamento\}\}/g, data.bookingTime)
      .replace(/\{\{barbearia_nome\}\}/g, barbershopName)
      .replace(/\{\{valor\}\}/g, data.price ? `R$ ${data.price.toFixed(2)}` : "—");
  };

  // Send Email notification
  if (data.clientEmail) {
    try {
      const emailContent = emailTemplate 
        ? replacePlaceholders(emailTemplate.content)
        : `${typeLabels[data.notificationType]}: ${data.serviceName} em ${data.bookingDate} às ${data.bookingTime}`;
      
      const emailSubject = emailTemplate?.subject 
        ? replacePlaceholders(emailTemplate.subject)
        : typeLabels[data.notificationType];

      const { error } = await supabase.functions.invoke("send-email-webhook", {
        body: {
          barbershopId: data.barbershopId,
          payload: {
            notification_type: data.notificationType,
            client_name: data.clientName,
            client_email: data.clientEmail,
            service_name: data.serviceName,
            professional_name: data.professionalName,
            booking_date: data.bookingDate,
            booking_time: data.bookingTime,
            barbershop_name: barbershopName,
            price: data.price,
            email_subject: emailSubject,
            email_content: emailContent,
          },
        },
      });

      if (error) {
        errors.push(`Email: ${error.message}`);
      } else {
        emailSent = true;
        console.log(`Email ${data.notificationType} notification sent to ${data.clientEmail}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Email: ${message}`);
    }
  }

  // Send WhatsApp notification
  if (data.clientPhone && settings?.whatsapp_enabled) {
    try {
      // Normalize phone number
      let phone = data.clientPhone.replace(/\D/g, "");
      if (!phone.startsWith("55")) {
        phone = `55${phone}`;
      }

      const whatsappContent = whatsappTemplate
        ? replacePlaceholders(whatsappTemplate.content)
        : `*${typeLabels[data.notificationType]}*\n\n` +
          `👤 Cliente: ${data.clientName}\n` +
          `✂️ Serviço: ${data.serviceName}\n` +
          `👨‍💼 Profissional: ${data.professionalName}\n` +
          `📅 Data: ${data.bookingDate}\n` +
          `⏰ Horário: ${data.bookingTime}`;

      const { error } = await supabase.functions.invoke("send-whatsapp-webhook", {
        body: {
          barbershopId: data.barbershopId,
          instanceName,
          payload: {
            notification_type: data.notificationType,
            client_name: data.clientName,
            client_phone: phone,
            service_name: data.serviceName,
            professional_name: data.professionalName,
            booking_date: data.bookingDate,
            booking_time: data.bookingTime,
            barbershop_name: barbershopName,
            price: data.price,
            message: whatsappContent,
          },
        },
      });

      if (error) {
        errors.push(`WhatsApp: ${error.message}`);
      } else {
        whatsappSent = true;
        console.log(`WhatsApp ${data.notificationType} notification sent to ${phone}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`WhatsApp: ${message}`);
    }
  }

  return { emailSent, whatsappSent, errors };
}

/**
 * Helper to fetch booking details and send notifications
 */
export async function sendNotificationForBooking(
  bookingId: string,
  notificationType: NotificationType
): Promise<{ success: boolean; errors: string[] }> {
  // Fetch complete booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      id,
      barbershop_id,
      booking_date,
      booking_time,
      price,
      client_id,
      service:services(name),
      professional:professionals(name)
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { success: false, errors: ["Booking not found"] };
  }

  // Fetch client profile
  let clientData = { name: "Cliente", email: null as string | null, phone: null as string | null };
  if (booking.client_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, phone")
      .eq("user_id", booking.client_id)
      .single();
    
    if (profile) {
      clientData = {
        name: profile.name || "Cliente",
        email: profile.email,
        phone: profile.phone,
      };
    }
  }

  const result = await sendBookingNotifications({
    bookingId: booking.id,
    barbershopId: booking.barbershop_id,
    clientName: clientData.name,
    clientEmail: clientData.email,
    clientPhone: clientData.phone,
    serviceName: (booking.service as any)?.name || "Serviço",
    professionalName: (booking.professional as any)?.name || "Profissional",
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time,
    price: booking.price || undefined,
    notificationType,
  });

  return {
    success: result.emailSent || result.whatsappSent,
    errors: result.errors,
  };
}
