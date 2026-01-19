import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

  try {
    // Validate environment variable
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N email webhook URL not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email webhook não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { barbershopId, payload, isTest }: RequestBody = await req.json();
    
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
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao enviar email via webhook" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookData = await webhookRes.json().catch(() => ({}));
    console.log("n8n webhook response:", webhookData);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado para o webhook" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-email-webhook:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
