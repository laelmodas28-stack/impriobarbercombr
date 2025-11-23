import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBarbershop = () => {
  const { user } = useAuth();

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { barbershop, isLoading, error };
};
