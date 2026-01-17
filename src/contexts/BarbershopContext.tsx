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
  is_official?: boolean;
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

interface BarbershopProviderProps {
  children: ReactNode;
  slug?: string;
  isOfficial?: boolean;
}

export const BarbershopProvider: React.FC<BarbershopProviderProps> = ({ children, slug: propSlug, isOfficial = false }) => {
  const params = useParams<{ slug?: string }>();
  const queryClient = useQueryClient();
  
  // Slug da URL tem prioridade absoluta (exceto se for oficial)
  const currentSlug = isOfficial ? undefined : (propSlug || params.slug);
  
  // Ref para rastrear o último identificador processado
  const lastIdentifierRef = useRef<string | null>(null);

  // RESET completo do cache quando o identificador muda
  useEffect(() => {
    const currentIdentifier = isOfficial ? "official" : currentSlug;
    if (currentIdentifier && currentIdentifier !== lastIdentifierRef.current) {
      queryClient.resetQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.resetQueries({ queryKey: ["barbershop-official"] });
      queryClient.removeQueries({ queryKey: ["barbershop-by-slug", lastIdentifierRef.current] });
      queryClient.removeQueries({ queryKey: ["barbershop-official"] });
      lastIdentifierRef.current = currentIdentifier;
    }
  }, [currentSlug, isOfficial, queryClient]);

  // Query para buscar barbearia - oficial ou por slug
  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: isOfficial ? ["barbershop-official"] : ["barbershop-by-slug", currentSlug],
    queryFn: async () => {
      if (isOfficial) {
        // Buscar barbearia oficial
        const { data, error: fetchError } = await supabase
          .from("barbershops")
          .select("*")
          .eq("is_official", true)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        return data;
      } else {
        // Buscar por slug
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
      }
    },
    enabled: isOfficial || !!currentSlug,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const baseUrl = isOfficial ? "" : (currentSlug ? `/b/${currentSlug}` : "");

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
