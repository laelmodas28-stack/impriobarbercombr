import React, { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  opening_time: string | null;
  closing_time: string | null;
  opening_days: string[] | null;
  primary_color: string;
  mensagem_personalizada: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface BarbershopContextType {
  barbershop: Barbershop | null;
  isLoading: boolean;
  error: Error | null;
  slug: string | null;
  baseUrl: string;
}

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

export const BarbershopProvider: React.FC<{ children: ReactNode; slug?: string }> = ({ children, slug: propSlug }) => {
  const params = useParams<{ slug?: string }>();
  const queryClient = useQueryClient();
  
  // Slug da URL tem prioridade absoluta
  const currentSlug = propSlug || params.slug;
  
  // Ref para rastrear o último slug processado
  const lastSlugRef = useRef<string | null>(null);

  // RESET completo do cache quando o slug muda
  useEffect(() => {
    if (currentSlug && currentSlug !== lastSlugRef.current) {
      // Resetar TODAS as queries relacionadas a barbearia
      queryClient.resetQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.removeQueries({ queryKey: ["barbershop-by-slug", lastSlugRef.current] });
      
      lastSlugRef.current = currentSlug;
    }
  }, [currentSlug, queryClient]);

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-by-slug", currentSlug],
    queryFn: async () => {
      if (!currentSlug) {
        return null;
      }

      const { data, error: fetchError } = await supabase
        .from("barbershops")
        .select("*")
        .eq("slug", currentSlug)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      return data;
    },
    enabled: !!currentSlug,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache garbage
    refetchOnMount: "always",
  });

  const baseUrl = currentSlug ? `/b/${currentSlug}` : "";

  return (
    <BarbershopContext.Provider 
      value={{ 
        barbershop, 
        isLoading, 
        error: error as Error | null,
        slug: currentSlug || null,
        baseUrl
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
};

export const useBarbershop = () => {
  const context = useContext(BarbershopContext);
  if (context === undefined) {
    throw new Error("useBarbershop must be used within a BarbershopProvider");
  }
  return context;
};

export { BarbershopContext };
