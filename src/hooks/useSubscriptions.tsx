import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  benefits: string[] | null;
  is_active: boolean;
  barbershop_id: string;
  created_at: string;
}

export interface ClientSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  barbershop_id: string;
  started_at: string;
  expires_at: string;
  status: string | null;
  created_at: string;
  payment_method: string | null;
  transaction_id: string | null;
  mercadopago_preference_id: string | null;
  plan?: SubscriptionPlan;
  barbershop?: {
    name: string;
    logo_url: string | null;
  };
}

export const useSubscriptions = (barbershopId?: string) => {
  const { user } = useAuth();

  // Buscar planos disponíveis
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["subscription-plans", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("price");
      
      if (error) throw error;
      return data as SubscriptionPlan[];
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as ClientSubscription[];
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
          client:profiles(name, phone)
        `)
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as (ClientSubscription & { client?: { name: string; phone: string } })[];
    },
    enabled: !!barbershopId,
  });

  const activeSubscription = clientSubscriptions?.find(
    sub => sub.status === 'active' && new Date(sub.expires_at) >= new Date()
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
