import { Outlet, useParams, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarbershopProvider } from "@/contexts/BarbershopContext";
import { Loader2 } from "lucide-react";

const STORAGE_KEY = "last_barbershop_slug";

const BarbershopLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  // Invalidar cache quando o slug muda para garantir dados frescos
  useEffect(() => {
    if (slug) {
      // Limpar caches antigos antes de buscar novos dados
      queryClient.removeQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.removeQueries({ queryKey: ["barbershop-context-fallback"] });
      
      // Atualizar localStorage
      localStorage.setItem(STORAGE_KEY, slug);
    }
  }, [slug, queryClient]);

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-exists", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("barbershops")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 0, // Sempre buscar dados frescos
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !barbershop) {
    return <Navigate to="/" replace />;
  }

  return (
    <BarbershopProvider slug={slug}>
      <Outlet />
    </BarbershopProvider>
  );
};

export default BarbershopLayout;
