import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_WHATSAPP_WEBHOOK_URL = Deno.env.get("N8N_WHATSAPP_WEBHOOK_URL") || "";

interface RequestBody {
  barbershopId: string;
  phone: string;
  message: string;
  isTest?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let barbershopId: string | undefined;
  let phone: string | undefined;
  let message: string | undefined;

  try {
    // Validate environment variable
    if (!N8N_WHATSAPP_WEBHOOK_URL) {
      console.error("N8N WhatsApp webhook URL not configured");
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp webhook não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    barbershopId = body.barbershopId;
    phone = body.phone;
    message = body.message;
    const isTest = body.isTest;
    
    if (!barbershopId || !message) {
      return new Response(
        JSON.stringify({ success: false, message: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending WhatsApp message${isTest ? " (TEST)" : ""} via n8n webhook`);

    // Send to n8n webhook
    const webhookRes = await fetch(N8N_WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        barbershopId,
        phone: phone || "test",
        message,
        isTest: isTest || false,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text();
      console.error("Error calling n8n webhook:", errorText);
      
      // Log failed notification
      if (!isTest && barbershopId) {
        await supabase.from("notification_logs").insert({
          barbershop_id: barbershopId,
          channel: "whatsapp",
          recipient_contact: phone || "unknown",
          status: "failed",
          content: message,
          error_message: errorText,
          sent_at: new Date().toISOString(),
        });
        console.log("Notification failure logged");
      }
      
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao enviar mensagem via webhook" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookData = await webhookRes.json().catch(() => ({}));
    console.log("n8n webhook response:", webhookData);

    // Log successful notification
    if (!isTest && barbershopId) {
      const { error: logError } = await supabase.from("notification_logs").insert({
        barbershop_id: barbershopId,
        channel: "whatsapp",
        recipient_contact: phone || "unknown",
        status: "sent",
        content: message,
        sent_at: new Date().toISOString(),
      });
      
      if (logError) {
        console.error("Error logging notification:", logError);
      } else {
        console.log("Notification logged successfully");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Mensagem enviada para o webhook" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-whatsapp-webhook:", error);
    
    // Try to log the error
    if (barbershopId) {
      try {
        await supabase.from("notification_logs").insert({
          barbershop_id: barbershopId,
          channel: "whatsapp",
          recipient_contact: phone || "unknown",
          status: "failed",
          content: message || "WhatsApp message",
          error_message: error instanceof Error ? error.message : "Unknown error",
          sent_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.error("Failed to log notification error:", logErr);
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
