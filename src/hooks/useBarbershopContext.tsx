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

      // PRIORIDADE 1: Verificar se o usuário é admin de alguma barbearia
      const { data: adminRole, error: adminError } = await supabase
        .from("user_roles")
        .select("barbershop_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .not("barbershop_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (!adminError && adminRole?.barbershop_id) {
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .eq("id", adminRole.barbershop_id)
          .single();
        
        if (error) throw error;
        return data;
      }

      // PRIORIDADE 2: Verificar se é super_admin ou barber
      const { data: otherRole, error: roleError } = await supabase
        .from("user_roles")
        .select("barbershop_id, role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "barber"])
        .not("barbershop_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (!roleError && otherRole?.barbershop_id) {
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .eq("id", otherRole.barbershop_id)
          .single();
        
        if (error) throw error;
        return data;
      }

      // PRIORIDADE 3: Verificar se é dono de alguma barbearia
      const { data: ownedBarbershop, error: ownedError } = await supabase
        .from("barbershops")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!ownedError && ownedBarbershop) {
        return ownedBarbershop;
      }

      // PRIORIDADE 4: Se é cliente, verificar último agendamento
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
