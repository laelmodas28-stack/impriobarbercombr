import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for upcoming bookings to send reminders...");

    // Buscar configurações de notificação de todas as barbearias
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("enabled", true);

    if (settingsError) throw settingsError;

    console.log(`Found ${notificationSettings?.length || 0} barbershops with notifications enabled`);

    const notifications = [];

    for (const settings of notificationSettings || []) {
      const reminderMinutes = settings.reminder_minutes || 30;
      
      // Calcular o horário alvo (now + reminder_minutes)
      const now = new Date();
      const targetTime = new Date(now.getTime() + reminderMinutes * 60000);
      
      // Criar janela de tempo (5 minutos antes e depois do target)
      const windowStart = new Date(targetTime.getTime() - 5 * 60000);
      const windowEnd = new Date(targetTime.getTime() + 5 * 60000);

      // Buscar agendamentos que acontecerão dentro da janela de tempo
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name),
          service:services(name),
          professional:professionals(name),
          barbershop:barbershops(name)
        `)
        .eq("barbershop_id", settings.barbershop_id)
        .in("status", ["pending", "confirmed"])
        .gte("booking_date", now.toISOString().split('T')[0])
        .lte("booking_date", targetTime.toISOString().split('T')[0]);

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        continue;
      }

      // Filtrar bookings que estão na janela de tempo correta
      const relevantBookings = (bookings || []).filter(booking => {
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        return bookingDateTime >= windowStart && bookingDateTime <= windowEnd;
      });

      console.log(`Found ${relevantBookings.length} bookings for barbershop ${settings.barbershop_id}`);

      for (const booking of relevantBookings) {
        // Verificar se já enviamos lembrete para este agendamento
        const { data: alreadySent } = await supabase
          .from("booking_reminders_sent")
          .select("id")
          .eq("booking_id", booking.id)
          .single();

        if (alreadySent) {
          console.log(`Reminder already sent for booking ${booking.id}`);
          continue;
        }

        // Buscar email do cliente
        const { data: auth } = await supabase.auth.admin.getUserById(booking.client_id);
        
        if (!auth?.user?.email) {
          console.log(`No email found for client ${booking.client_id}`);
          continue;
        }

        try {
          // Enviar notificação
          await supabase.functions.invoke("send-booking-notification", {
            body: {
              bookingId: booking.id,
              clientEmail: auth.user.email,
              clientName: booking.client?.full_name || "Cliente",
              clientPhone: auth.user.phone,
              serviceName: booking.service?.name || "Serviço",
              professionalName: booking.professional?.name || "Profissional",
              bookingDate: booking.booking_date,
              bookingTime: booking.booking_time,
              barbershopId: booking.barbershop_id,
              isReminder: true,
            },
          });

          // Marcar como enviado
          await supabase
            .from("booking_reminders_sent")
            .insert({ booking_id: booking.id });

          notifications.push({
            booking_id: booking.id,
            client: auth.user.email,
            time: `${booking.booking_date} ${booking.booking_time}`,
            status: "sent",
          });

          console.log(`Reminder sent for booking ${booking.id} to ${auth.user.email}`);
        } catch (notifError: any) {
          console.error(`Error sending reminder for booking ${booking.id}:`, notifError);
          notifications.push({
            booking_id: booking.id,
            client: auth.user.email,
            status: "error",
            error: notifError?.message || "Unknown error",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked bookings and sent ${notifications.length} reminders`,
        notifications: notifications,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error checking booking reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
