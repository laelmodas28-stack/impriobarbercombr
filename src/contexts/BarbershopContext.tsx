import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  const location = useLocation();

  // Determinar slug de forma síncrona: prop > URL > localStorage
  const resolvedSlug = useMemo(() => {
    const urlSlug = propSlug || params.slug;
    if (urlSlug) {
      // Salvar no localStorage para visitas futuras
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, urlSlug);
      }
      return urlSlug;
    }
    // Verificar localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  }, [propSlug, params.slug, location.pathname]);

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-by-slug", resolvedSlug],
    queryFn: async () => {
      if (!resolvedSlug) {
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
        .eq("slug", resolvedSlug)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      // Salvar slug se encontrou
      if (data?.slug) {
        localStorage.setItem(STORAGE_KEY, data.slug);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
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
