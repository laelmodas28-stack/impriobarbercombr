import { supabase } from "@/integrations/supabase/client";

interface EvolutionApiSettings {
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  evolution_instance_name: string | null;
  whatsapp_enabled: boolean;
  whatsapp_send_booking_confirmation: boolean;
  whatsapp_send_booking_reminder: boolean;
}

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

export async function getWhatsAppSettings(barbershopId: string): Promise<EvolutionApiSettings | null> {
  const { data, error } = await supabase
    .from("barbershop_settings")
    .select(`
      evolution_api_url,
      evolution_api_key,
      evolution_instance_name,
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

export async function getInstanceStatus(
  apiUrl: string,
  apiKey: string,
  instanceName: string
): Promise<ConnectionStatus> {
  const cleanUrl = apiUrl.replace(/\/$/, "");

  try {
    const response = await fetch(
      `${cleanUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          "apikey": apiKey,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { state: "error", message: "Instância não encontrada" };
      }
      return { state: "error", message: "Erro ao verificar status" };
    }

    const data = await response.json();
    
    // Extract phone number if available
    let phoneNumber: string | undefined;
    if (data.instance?.owner) {
      phoneNumber = data.instance.owner.split("@")[0];
    }

    return {
      state: data.state || data.instance?.state || "unknown",
      phoneNumber,
    };
  } catch (error) {
    console.error("Error getting instance status:", error);
    return { state: "error", message: "Erro de conexão com o servidor" };
  }
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

  if (!settings.evolution_api_url || !settings.evolution_api_key || !settings.evolution_instance_name) {
    console.log("Evolution API not configured");
    return false;
  }

  const formattedPhone = formatPhoneNumber(phone);
  const apiUrl = settings.evolution_api_url.replace(/\/$/, ""); // Remove trailing slash

  try {
    const response = await fetch(
      `${apiUrl}/message/sendText/${settings.evolution_instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": settings.evolution_api_key,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Evolution API error:", errorData);
      return false;
    }

    console.log("WhatsApp message sent successfully");
    return true;
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

export async function testEvolutionApiConnection(
  apiUrl: string,
  apiKey: string,
  instanceName: string
): Promise<{ success: boolean; message: string; qrCode?: string }> {
  const cleanUrl = apiUrl.replace(/\/$/, "");

  try {
    // First check if instance exists
    const instanceResponse = await fetch(`${cleanUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        "apikey": apiKey,
      },
    });

    if (!instanceResponse.ok) {
      return { 
        success: false, 
        message: "Falha na autenticação. Verifique a API Key." 
      };
    }

    const instances = await instanceResponse.json();
    const instance = instances.find((i: any) => i.instance?.instanceName === instanceName);

    if (!instance) {
      return { 
        success: false, 
        message: `Instância "${instanceName}" não encontrada. Crie-a primeiro no Evolution API.` 
      };
    }

    // Check connection status
    const connectionResponse = await fetch(
      `${cleanUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          "apikey": apiKey,
        },
      }
    );

    if (!connectionResponse.ok) {
      return { 
        success: false, 
        message: "Erro ao verificar status da conexão." 
      };
    }

    const connectionState = await connectionResponse.json();
    
    if (connectionState.state === "open") {
      return { 
        success: true, 
        message: "WhatsApp conectado e pronto para uso!" 
      };
    } else {
      // Get QR Code if not connected
      const qrResponse = await fetch(`${cleanUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: {
          "apikey": apiKey,
        },
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        return { 
          success: false, 
          message: "WhatsApp não conectado. Escaneie o QR Code para conectar.",
          qrCode: qrData.base64 || qrData.qrcode?.base64
        };
      }

      return { 
        success: false, 
        message: "WhatsApp não conectado. Acesse o Evolution API para configurar." 
      };
    }
  } catch (error) {
    console.error("Error testing Evolution API:", error);
    return { 
      success: false, 
      message: "Erro de conexão. Verifique a URL do servidor." 
    };
  }
}
