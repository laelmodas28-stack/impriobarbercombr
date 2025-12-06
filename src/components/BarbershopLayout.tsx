import { Outlet, useParams, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarbershopProvider } from "@/contexts/BarbershopContext";
import { Loader2 } from "lucide-react";

const BarbershopLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const lastSlugRef = useRef<string | null>(null);

  // RESET completo quando o slug muda
  useEffect(() => {
    if (slug && slug !== lastSlugRef.current) {
      // Resetar TODAS as queries para forçar busca fresca
      queryClient.resetQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.resetQueries({ queryKey: ["barbershop-exists"] });
      
      // Remover cache do slug anterior
      if (lastSlugRef.current) {
        queryClient.removeQueries({ queryKey: ["barbershop-exists", lastSlugRef.current] });
        queryClient.removeQueries({ queryKey: ["barbershop-by-slug", lastSlugRef.current] });
      }
      
      lastSlugRef.current = slug;
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
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
