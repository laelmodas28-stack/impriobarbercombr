import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBarbershopClients = (barbershopId?: string) => {
  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ["barbershop-clients", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      
      const { data, error } = await supabase
        .from("barbershop_clients")
        .select(`
          *,
          client:profiles!barbershop_clients_client_id_fkey (
            id,
            full_name,
            phone,
            avatar_url
          )
        `)
        .eq("barbershop_id", barbershopId)
        .order("last_visit", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
  });

  const getInactiveClients = (days: number = 30) => {
    if (!clients) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return clients.filter(client => {
      if (!client.last_visit) return true;
      return new Date(client.last_visit) < cutoffDate;
    });
  };

  return { 
    clients, 
    isLoading, 
    error, 
    refetch,
    getInactiveClients 
  };
};
