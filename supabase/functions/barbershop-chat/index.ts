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

// Helper to get current date info in Brazil timezone
function getCurrentDateInfo() {
  const now = new Date();
  // Ajustar para horário de Brasília (UTC-3)
  const brasilOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const brasilTime = new Date(now.getTime() + (localOffset + brasilOffset) * 60 * 1000);
  
  const year = brasilTime.getFullYear();
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasilTime.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;
  
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const currentDayOfWeek = dayNames[brasilTime.getDay()];
  
  // Calcular amanhã
  const tomorrow = new Date(brasilTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowYear = tomorrow.getFullYear();
  const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowDate = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
  const tomorrowDayOfWeek = dayNames[tomorrow.getDay()];
  
  return {
    currentDate,
    currentDayOfWeek,
    tomorrowDate,
    tomorrowDayOfWeek,
    currentTime: `${String(brasilTime.getHours()).padStart(2, '0')}:${String(brasilTime.getMinutes()).padStart(2, '0')}`
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // SECURITY: Extract user from JWT token instead of trusting client-provided userId
    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Create a client with the anon key to verify the user's token
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (!authError && user) {
        authenticatedUserId = user.id;
        console.log("Authenticated user:", authenticatedUserId);
      } else {
        console.log("No authenticated user or auth error:", authError?.message);
      }
    }

    // Schema validation - userId is no longer accepted from body for security
    const chatSchema = z.object({
      message: z.string().min(1).max(2000),
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(5000)
      })).max(50).optional().default([]),
      barbershopId: z.string().uuid().optional()
    });

    const body = await req.json();
    const { message, history, barbershopId } = chatSchema.parse(body);

    // Use authenticated user ID (from token) - cannot be spoofed
    const userId = authenticatedUserId;

    console.log("Chat request received:", { 
      userId: userId ? "authenticated" : "anonymous", 
      barbershopId, 
      messageLength: message.length 
    });

    // Rate limiting - use authenticated userId if available, otherwise use IP or anonymous
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch barbershop data - filter by barbershopId if provided
    let barbershopQuery = supabase.from("barbershops").select("*");
    
    if (barbershopId) {
      barbershopQuery = barbershopQuery.eq("id", barbershopId);
    }
    
    const { data: barbershop } = await barbershopQuery.single();

    if (!barbershop) {
      console.error("Barbershop not found:", barbershopId);
      return new Response(
        JSON.stringify({
          response: "Desculpe, não encontrei informações da barbearia. Tente novamente mais tarde.",
          bookingCreated: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching data for barbershop:", barbershop.name, barbershop.id);

    // Fetch services - filtered by barbershop
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true);

    // Fetch professionals - filtered by barbershop
    const { data: professionals } = await supabase
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .eq("is_active", true);

    console.log("Data fetched:", { 
      barbershopName: barbershop.name,
      servicesCount: services?.length || 0, 
      professionalsCount: professionals?.length || 0 
    });

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

    // Get current date info
    const dateInfo = getCurrentDateInfo();

    // Build context for AI
    const servicesText = services && services.length > 0
      ? services.map((s) => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)${s.description ? ' - ' + s.description : ''}`).join("\n")
      : "Nenhum serviço disponível no momento";

    const professionalsText = professionals && professionals.length > 0
      ? professionals.map((p) => `- ${p.name} (ID: ${p.id})${p.specialties?.length ? ' - Especialidades: ' + p.specialties.join(', ') : ''}`).join("\n")
      : "Nenhum profissional disponível no momento";

    const userInfo = userProfile
      ? `Cliente logado: ${userProfile.full_name}${userProfile.phone ? ' - Tel: ' + userProfile.phone : ''}`
      : "Cliente não está logado";

    const systemPrompt = `Você é o assistente oficial da barbearia "${barbershop.name}".

ESTILO DE COMUNICAÇÃO: ${barbershop.mensagem_personalizada || 'Profissional e acolhedor'}

📅 DATA E HORA ATUAL (MUITO IMPORTANTE):
- HOJE é ${dateInfo.currentDayOfWeek}, ${dateInfo.currentDate}
- AMANHÃ é ${dateInfo.tomorrowDayOfWeek}, ${dateInfo.tomorrowDate}
- Hora atual: ${dateInfo.currentTime}
- Quando o cliente disser "hoje", use a data ${dateInfo.currentDate}
- Quando o cliente disser "amanhã", use a data ${dateInfo.tomorrowDate}
- Para outros dias da semana, calcule a data correta baseado em hoje

INFORMAÇÕES DA BARBEARIA:
${barbershop.description || ''}
Endereço: ${barbershop.address || 'Não informado'}
Telefone: ${barbershop.phone || 'Não informado'}
WhatsApp: ${barbershop.whatsapp || 'Não informado'}
Horário: ${barbershop.opening_time || '09:00'} às ${barbershop.closing_time || '19:00'}
Dias: ${barbershop.opening_days?.join(', ') || 'Segunda a Sábado'}

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
- Use o formato de data YYYY-MM-DD (ex: ${dateInfo.currentDate})
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

          if (response.status >= 500 && attempt < retries) {
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
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
      throw new Error("AI_UNAVAILABLE");
    };

    let assistantMessage = "";
    let bookingCreated = false;

    try {
      const aiResponse = await callAI();
      const aiData = await aiResponse.json();
      assistantMessage = aiData.choices[0].message.content;
    } catch (aiError: any) {
      console.error("AI service error, using fallback:", aiError.message);
      
      const fallbackMessages = [
        `Olá! Sou o assistente da ${barbershop.name}. 💈`,
        "",
        "No momento estou com dificuldades técnicas, mas posso te ajudar com informações básicas:",
        "",
        "📍 **Endereço:** " + (barbershop.address || "Consulte nosso WhatsApp"),
        "⏰ **Horário:** " + (barbershop.opening_time || "09:00") + " às " + (barbershop.closing_time || "19:00"),
        "📅 **Dias:** " + (barbershop.opening_days?.join(", ") || "Segunda a Sábado"),
        "",
        "**Nossos Serviços:**",
        servicesText,
        "",
        "**Para agendar:**",
        userProfile 
          ? "Use a página de agendamento ou entre em contato pelo WhatsApp: " + (barbershop.whatsapp || "")
          : "Faça login primeiro e depois acesse a página de agendamento.",
        "",
        "Em breve estarei funcionando normalmente! 🙏"
      ];
      
      assistantMessage = fallbackMessages.join("\n");
      
      return new Response(
        JSON.stringify({
          response: assistantMessage,
          bookingCreated: false,
          fallbackMode: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if AI wants to create a booking - SECURITY: Only create if user is authenticated
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
          // Check for booking conflicts
          const { data: conflictBooking } = await supabase
            .from("bookings")
            .select("id")
            .eq("professional_id", professionalId)
            .eq("booking_date", bookingData.date)
            .eq("booking_time", bookingData.time + ":00")
            .in("status", ["pending", "confirmed"])
            .maybeSingle();

          if (conflictBooking) {
            console.log("Booking conflict detected:", conflictBooking.id);
            // Remove JSON from response and add conflict message
            const cleanResponse = assistantMessage.replace(/\{[\s\S]*"action":\s*"create_booking"[\s\S]*\}/, "").trim();
            
            return new Response(
              JSON.stringify({
                response: cleanResponse + `\n\n⚠️ Desculpe, o horário ${bookingData.time} do dia ${bookingData.date} já está ocupado para este profissional. Por favor, escolha outro horário.`,
                bookingCreated: false,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          // Create booking - SECURITY: Using authenticated userId from token
          const { data: newBooking, error: bookingError } = await supabase.from("bookings").insert({
            client_id: userId,
            service_id: service.id,
            professional_id: professionalId,
            barbershop_id: barbershop.id,
            booking_date: bookingData.date,
            booking_time: bookingData.time + ":00",
            total_price: service.price,
            status: "pending",
          }).select().single();

          if (!bookingError && newBooking) {
            bookingCreated = true;
            console.log("Booking created successfully:", newBooking.id);

            // Create notification for the client
            const professional = professionals?.find(p => p.id === professionalId);
            const { error: notifError } = await supabase.from("notifications").insert({
              user_id: userId,
              barbershop_id: barbershop.id,
              type: "booking_confirmation",
              title: "Agendamento Confirmado! ✅",
              message: `Seu agendamento de ${service.name} foi confirmado para ${bookingData.date} às ${bookingData.time} com ${professional?.name || 'nosso profissional'}.`,
              booking_id: newBooking.id,
              read: false,
            });

            if (notifError) {
              console.error("Error creating notification:", notifError);
            } else {
              console.log("Notification created for booking:", newBooking.id);
            }

            // Optionally call send-booking-notification for email/SMS
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-booking-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  bookingId: newBooking.id,
                  barbershopId: barbershop.id,
                }),
              });
            } catch (notifFetchError) {
              console.error("Error calling send-booking-notification:", notifFetchError);
            }
          } else {
            console.error("Booking creation error:", bookingError);
          }
        }
      } catch (e) {
        console.error("Booking creation error:", e);
      }
    } else if (jsonMatch && !userId) {
      // User tried to book but is not authenticated
      console.log("Booking attempt without authentication - rejected");
      const cleanResponse = assistantMessage.replace(/\{[\s\S]*"action":\s*"create_booking"[\s\S]*\}/, "").trim();
      
      return new Response(
        JSON.stringify({
          response: cleanResponse + "\n\n⚠️ Para confirmar o agendamento, você precisa estar logado. Por favor, faça login primeiro.",
          bookingCreated: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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