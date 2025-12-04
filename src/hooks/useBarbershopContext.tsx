import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBarbershopContext = () => {
  const { user } = useAuth();

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-context", user?.id],
    queryFn: async () => {
      if (!user) {
        // Se não logado, retorna a primeira barbearia (padrão)
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      }

      // Primeiro, verificar se o usuário é admin de alguma barbearia
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("barbershop_id, role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin", "barber"])
        .maybeSingle();

      if (roleError && roleError.code !== "PGRST116") throw roleError;

      if (userRole?.barbershop_id) {
        // Se é admin/barber, retorna sua própria barbearia
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .eq("id", userRole.barbershop_id)
          .single();
        
        if (error) throw error;
        return data;
      }

      // Se é cliente, verificar último agendamento para contexto
      const { data: lastBooking, error: bookingError } = await supabase
        .from("bookings")
        .select("barbershop_id")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!bookingError && lastBooking?.barbershop_id) {
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .eq("id", lastBooking.barbershop_id)
          .single();
        
        if (error) throw error;
        return data;
      }

      // Fallback: primeira barbearia disponível
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return { barbershop, isLoading, error };
};
