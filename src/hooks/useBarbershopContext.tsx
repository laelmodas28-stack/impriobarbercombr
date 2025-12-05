import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarbershopContext } from "@/contexts/BarbershopContext";

const STORAGE_KEY = "last_barbershop_slug";

export const useBarbershopContext = () => {
  const { user } = useAuth();
  const params = useParams<{ slug?: string }>();
  const location = useLocation();
  
  // Tentar usar o contexto do BarbershopProvider (pode ser undefined)
  const contextValue = useContext(BarbershopContext);

  // Verificar slug na URL ou localStorage de forma síncrona
  const resolvedSlug = useMemo(() => {
    const urlSlug = params.slug;
    if (urlSlug) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, urlSlug);
      }
      return urlSlug;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  }, [params.slug, location.pathname]);

  // Query para buscar barbearia - sempre executa mas pode usar dados do contexto
  const { data: queriedBarbershop, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ["barbershop-context-fallback", user?.id, resolvedSlug],
    queryFn: async () => {
      // Se já temos dados do contexto, não precisamos buscar novamente
      if (contextValue?.barbershop) {
        return null;
      }

      // PRIORIDADE 1: Slug na URL ou localStorage
      if (resolvedSlug) {
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .eq("slug", resolvedSlug)
          .maybeSingle();
        
        if (!error && data) {
          return data;
        }
      }

      if (!user) {
        // Se não logado, retorna a primeira barbearia (padrão)
        const { data, error } = await supabase
          .from("barbershops")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.slug) {
          localStorage.setItem(STORAGE_KEY, data.slug);
        }
        
        return data;
      }

      // PRIORIDADE 2: Verificar se o usuário é admin de alguma barbearia
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
        
        if (data?.slug) {
          localStorage.setItem(STORAGE_KEY, data.slug);
        }
        
        return data;
      }

      // PRIORIDADE 3: Verificar se é super_admin ou barber
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
        
        if (data?.slug) {
          localStorage.setItem(STORAGE_KEY, data.slug);
        }
        
        return data;
      }

      // PRIORIDADE 4: Verificar se é dono de alguma barbearia
      const { data: ownedBarbershop, error: ownedError } = await supabase
        .from("barbershops")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!ownedError && ownedBarbershop) {
        if (ownedBarbershop.slug) {
          localStorage.setItem(STORAGE_KEY, ownedBarbershop.slug);
        }
        return ownedBarbershop;
      }

      // PRIORIDADE 5: Se é cliente, verificar último agendamento
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
        
        if (data?.slug) {
          localStorage.setItem(STORAGE_KEY, data.slug);
        }
        
        return data;
      }

      // Fallback: primeira barbearia disponível
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.slug) {
        localStorage.setItem(STORAGE_KEY, data.slug);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !contextValue?.barbershop, // Só executa se não tiver dados do contexto
  });

  // Priorizar dados do contexto se disponíveis
  const barbershop = contextValue?.barbershop || queriedBarbershop;
  const isLoading = contextValue ? contextValue.isLoading : queryLoading;
  const error = contextValue?.error || queryError;
  const baseUrl = barbershop?.slug ? `/b/${barbershop.slug}` : "";

  return { barbershop, isLoading, error, baseUrl };
};
