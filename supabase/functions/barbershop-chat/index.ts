import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(identifier: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];
  const recentRequests = requests.filter(t => now - t < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Schema validation
    const chatSchema = z.object({
      message: z.string().min(1).max(2000),
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(5000)
      })).max(50).optional().default([]),
      userId: z.string().uuid().optional()
    });

    const body = await req.json();
    const { message, history, userId } = chatSchema.parse(body);

    // Rate limiting
    const rateLimitId = userId || 'anonymous';
    if (!checkRateLimit(rateLimitId)) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch barbershop data
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("*")
      .single();

    // Fetch services
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true);

    // Fetch professionals
    const { data: professionals } = await supabase
      .from("professionals")
      .select("*")
      .eq("is_active", true);

    // Get user profile if logged in
    let userProfile = null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      userProfile = data;
    }

    // Build context for AI
    const servicesText = services
      ?.map((s) => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)${s.description ? ' - ' + s.description : ''}`)
      .join("\n") || "Nenhum serviço disponível";

    const professionalsText = professionals
      ?.map((p) => `- ${p.name}${p.specialties?.length ? ' (Especialidades: ' + p.specialties.join(', ') + ')' : ''}`)
      .join("\n") || "Nenhum profissional disponível";

    const userInfo = userProfile
      ? `Cliente logado: ${userProfile.full_name}${userProfile.phone ? ' - Tel: ' + userProfile.phone : ''}`
      : "Cliente não está logado";

    const systemPrompt = `Você é o assistente oficial da barbearia "${barbershop?.name || 'Império Barber'}".

ESTILO DE COMUNICAÇÃO: ${barbershop?.mensagem_personalizada || 'Profissional e acolhedor'}

INFORMAÇÕES DA BARBEARIA:
${barbershop?.description || ''}
Endereço: ${barbershop?.address || 'Não informado'}
Telefone: ${barbershop?.phone || 'Não informado'}
WhatsApp: ${barbershop?.whatsapp || 'Não informado'}
Horário: ${barbershop?.opening_time || '09:00'} às ${barbershop?.closing_time || '19:00'}
Dias: ${barbershop?.opening_days?.join(', ') || 'Segunda a Sábado'}

SERVIÇOS DISPONÍVEIS:
${servicesText}

PROFISSIONAIS:
${professionalsText}

STATUS DO CLIENTE:
${userInfo}

SUAS FUNÇÕES:
1. Responder dúvidas sobre serviços, preços e horários
2. Ajudar o cliente a agendar serviços
3. Ser sempre educado, prestativo e seguir o estilo de comunicação da barbearia

REGRAS DE AGENDAMENTO:
- Se o cliente NÃO está logado: informe que precisa fazer login primeiro
- Se o cliente ESTÁ logado: colete as informações (serviço, data, horário, profissional opcional)
- Sempre confirme antes de criar o agendamento
- Quando o cliente CONFIRMAR o agendamento, retorne no formato JSON:
{
  "action": "create_booking",
  "service_name": "nome do serviço",
  "professional_name": "nome do profissional (ou null se não especificado)",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

IMPORTANTE:
- Use emojis com moderação (💈 ✂️ ⏰ 📅 ✅)
- Seja conciso mas completo
- Se não souber algo, seja honesto
- Sempre termine oferecendo ajuda adicional`;

    // Build messages for AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    // Call Lovable AI with retry logic
    const callAI = async (retries = 3, delay = 1000): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`AI call attempt ${attempt}/${retries}`);
          
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages,
            }),
          });

          if (response.ok) {
            return response;
          }

          const errorText = await response.text();
          console.error(`AI attempt ${attempt} failed:`, response.status, errorText);

          // Only retry on 5xx errors (server errors)
          if (response.status >= 500 && attempt < retries) {
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }

          throw new Error(`AI service error: ${response.status}`);
        } catch (error: any) {
          if (attempt === retries) {
            throw error;
          }
          console.error(`AI attempt ${attempt} error:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
      throw new Error("AI service unavailable after retries");
    };

    const aiResponse = await callAI();

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Check if AI wants to create a booking
    let bookingCreated = false;
    const jsonMatch = assistantMessage.match(/\{[\s\S]*"action":\s*"create_booking"[\s\S]*\}/);
    
    if (jsonMatch && userId) {
      try {
        const bookingData = JSON.parse(jsonMatch[0]);
        
        // Find service by name
        const service = services?.find(
          (s) => s.name.toLowerCase().includes(bookingData.service_name.toLowerCase())
        );

        // Find professional by name (optional)
        let professionalId = null;
        if (bookingData.professional_name) {
          const professional = professionals?.find(
            (p) => p.name.toLowerCase().includes(bookingData.professional_name.toLowerCase())
          );
          professionalId = professional?.id || professionals?.[0]?.id;
        } else {
          professionalId = professionals?.[0]?.id;
        }

        if (service && professionalId && barbershop) {
          // Create booking
          const { error: bookingError } = await supabase.from("bookings").insert({
            client_id: userId,
            service_id: service.id,
            professional_id: professionalId,
            barbershop_id: barbershop.id,
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            total_price: service.price,
            status: "pending",
          });

          if (!bookingError) {
            bookingCreated = true;
          }
        }
      } catch (e) {
        console.error("Booking creation error:", e);
      }
    }

    // Remove JSON from response if present
    const cleanResponse = assistantMessage.replace(/\{[\s\S]*"action":\s*"create_booking"[\s\S]*\}/, "").trim();

    return new Response(
      JSON.stringify({
        response: cleanResponse,
        bookingCreated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Chat function error:", error);
    
    // Handle zod validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({
          response: "Mensagem inválida. Por favor, tente novamente.",
          bookingCreated: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        response: "Desculpe, tive um problema técnico. Por favor, tente novamente.",
        bookingCreated: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});