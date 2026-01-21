import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") || "";

interface RequestBody {
  barbershopId: string;
  payload: Record<string, unknown>;
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
  let recipientEmail: string | undefined;
  let messageContent: string | undefined;

  try {
    // Validate environment variable
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N email webhook URL not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email webhook não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    barbershopId = body.barbershopId;
    const { payload, isTest } = body;
    
    // Extract email and content for logging
    recipientEmail = (payload?.client_email as string) || (payload?.to as string) || "unknown";
    messageContent = (payload?.subject as string) || "Email notification";
    
    if (!barbershopId || !payload) {
      return new Response(
        JSON.stringify({ success: false, message: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notification${isTest ? " (TEST)" : ""} via n8n webhook`);

    // Send to n8n webhook
    const webhookRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        barbershopId,
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
          channel: "email",
          recipient_contact: recipientEmail || "unknown",
          status: "failed",
          content: messageContent,
          error_message: errorText,
          sent_at: new Date().toISOString(),
        });
        console.log("Notification failure logged");
      }
      
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao enviar email via webhook" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookData = await webhookRes.json().catch(() => ({}));
    console.log("n8n webhook response:", webhookData);

    // Log successful notification
    if (!isTest && barbershopId) {
      const { error: logError } = await supabase.from("notification_logs").insert({
        barbershop_id: barbershopId,
        channel: "email",
        recipient_contact: recipientEmail || "unknown",
        status: "sent",
        content: messageContent,
        sent_at: new Date().toISOString(),
      });
      
      if (logError) {
        console.error("Error logging notification:", logError);
      } else {
        console.log("Notification logged successfully");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado para o webhook" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-email-webhook:", error);
    
    // Try to log the error
    if (barbershopId) {
      try {
        await supabase.from("notification_logs").insert({
          barbershop_id: barbershopId,
          channel: "email",
          recipient_contact: recipientEmail || "unknown",
          status: "failed",
          content: messageContent || "Email notification",
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
