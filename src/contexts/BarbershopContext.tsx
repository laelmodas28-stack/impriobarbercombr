import React, { createContext, useContext, ReactNode, useMemo, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
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

const STORAGE_KEY = "last_barbershop_slug";

export const BarbershopProvider: React.FC<{ children: ReactNode; slug?: string }> = ({ children, slug: propSlug }) => {
  const params = useParams<{ slug?: string }>();
  const queryClient = useQueryClient();

  // Slug da URL tem prioridade absoluta
  const currentSlug = propSlug || params.slug;

  // Invalidar cache quando o slug muda
  useEffect(() => {
    if (currentSlug) {
      // Salvar novo slug no localStorage
      localStorage.setItem(STORAGE_KEY, currentSlug);
      
      // Invalidar queries antigas para garantir dados frescos
      queryClient.invalidateQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.invalidateQueries({ queryKey: ["barbershop-context-fallback"] });
    }
  }, [currentSlug, queryClient]);

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-by-slug", currentSlug],
    queryFn: async () => {
      if (!currentSlug) {
        // Fallback: primeira barbearia
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        // Salvar slug para próxima visita
        if (data?.slug) {
          localStorage.setItem(STORAGE_KEY, data.slug);
        }
        
        return data;
      }

      const { data, error: fetchError } = await supabase
        .from("barbershops")
        .select("*")
        .eq("slug", currentSlug)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      return data;
    },
    staleTime: 0, // Sempre buscar dados frescos quando o slug muda
    refetchOnMount: true,
  });

  const baseUrl = barbershop?.slug ? `/b/${barbershop.slug}` : "";

  return (
    <BarbershopContext.Provider 
      value={{ 
        barbershop, 
        isLoading, 
        error: error as Error | null,
        slug: barbershop?.slug || null,
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
