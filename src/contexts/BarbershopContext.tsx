import React, { createContext, useContext, ReactNode, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  
  // Slug da URL tem prioridade absoluta
  const currentSlug = propSlug || params.slug;
  
  // Ref para rastrear o último slug processado
  const lastSlugRef = useRef<string | null>(null);

  // Buscar usuário atual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // RESET completo do cache quando o slug muda
  useEffect(() => {
    if (currentSlug && currentSlug !== lastSlugRef.current) {
      queryClient.resetQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.removeQueries({ queryKey: ["barbershop-by-slug", lastSlugRef.current] });
      lastSlugRef.current = currentSlug;
    }
  }, [currentSlug, queryClient]);

  // Query para buscar barbearia - com fallback quando não há slug
  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-by-slug", currentSlug, user?.id],
    queryFn: async () => {
      // 1. Se tem slug, buscar por slug
      if (currentSlug) {
        const { data, error: fetchError } = await supabase
          .from("barbershops")
          .select("*")
          .eq("slug", currentSlug)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        return data;
      }

      // 2. Se user está logado, buscar barbearia onde ele é admin
      if (user) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("barbershop_id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .not("barbershop_id", "is", null)
          .maybeSingle();

        if (userRole?.barbershop_id) {
          const { data, error: fetchError } = await supabase
            .from("barbershops")
            .select("*")
            .eq("id", userRole.barbershop_id)
            .maybeSingle();
          
          if (fetchError) throw fetchError;
          return data;
        }
      }

      // 3. Fallback: buscar primeira barbearia disponível
      const { data, error: fetchError } = await supabase
        .from("barbershops")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      return data;
    },
    staleTime: 0,
    gcTime: 0,
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
