import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptions = (barbershopId?: string) => {
  const { user } = useAuth();

  // Buscar planos disponíveis
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["subscription-plans", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      
      const { data, error } = await supabase
        .from("subscription_plans")
        .select(`
          *,
          barbershop:barbershops(name)
        `)
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("price");
      
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
  });

  // Buscar assinaturas do cliente
  const { data: clientSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["client-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("client_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*),
          barbershop:barbershops(name, logo_url)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar todas as assinaturas (para admin)
  const { data: allSubscriptions, refetch: refetchAllSubscriptions } = useQuery({
    queryKey: ["all-subscriptions", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      
      const { data, error } = await supabase
        .from("client_subscriptions")
        .select(`
          *,
          plan:subscription_plans(name, price),
          client:profiles(full_name, phone)
        `)
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
  });

  const activeSubscription = clientSubscriptions?.find(
    sub => sub.status === 'active' && new Date(sub.end_date) >= new Date()
  );

  return {
    plans,
    plansLoading,
    refetchPlans,
    clientSubscriptions,
    subscriptionsLoading,
    refetchSubscriptions,
    activeSubscription,
    allSubscriptions,
    refetchAllSubscriptions,
  };
};
