import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarbershopProvider } from "@/contexts/BarbershopContext";
import { Loader2, RefreshCw } from "lucide-react";
import BarbershopMetaTags from "./BarbershopMetaTags";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BarbershopLayoutProps {
  isOfficial?: boolean;
}

const BarbershopLayout = ({ isOfficial = false }: BarbershopLayoutProps) => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lastSlugRef = useRef<string | null>(null);

  // Salvar slug atual em localStorage para persistência (apenas se não for oficial)
  useEffect(() => {
    if (slug && !isOfficial) {
      localStorage.setItem("origin_barbershop_slug", slug);
      sessionStorage.setItem("origin_barbershop_slug", slug);
    }
  }, [slug, isOfficial]);

  // RESET completo quando o slug muda
  useEffect(() => {
    const currentIdentifier = isOfficial ? "official" : slug;
    if (currentIdentifier && currentIdentifier !== lastSlugRef.current) {
      // Resetar TODAS as queries para forçar busca fresca
      queryClient.resetQueries({ queryKey: ["barbershop-by-slug"] });
      queryClient.resetQueries({ queryKey: ["barbershop-exists"] });
      queryClient.resetQueries({ queryKey: ["barbershop-official"] });
      
      // Remover cache do identificador anterior
      if (lastSlugRef.current) {
        queryClient.removeQueries({ queryKey: ["barbershop-exists", lastSlugRef.current] });
        queryClient.removeQueries({ queryKey: ["barbershop-by-slug", lastSlugRef.current] });
        queryClient.removeQueries({ queryKey: ["barbershop-official"] });
      }
      
      lastSlugRef.current = currentIdentifier;
    }
  }, [slug, isOfficial, queryClient]);

  // Query para barbearia oficial ou por slug
  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: isOfficial ? ["barbershop-official"] : ["barbershop-exists", slug],
    queryFn: async () => {
      if (isOfficial) {
        // Buscar barbearia oficial
        const { data, error } = await supabase
          .from("barbershops")
          .select("id, slug, name")
          .eq("is_official", true)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } else {
        // Buscar por slug
        if (!slug) return null;

        const { data, error } = await supabase
          .from("barbershops")
          .select("id, slug, name")
          .eq("slug", slug)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      }
    },
    enabled: isOfficial || !!slug,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // Não redirecionar - apenas mostrar mensagem se não encontrar barbearia oficial
  // Redirecionar causaria loop já que "/" também usa isOfficial={true}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Erro ou barbearia não encontrada
  if (error || !barbershop) {
    // Se for oficial e não encontrou, mostrar mensagem amigável
    if (isOfficial) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full border-border">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Configuração necessária</h2>
              <p className="text-muted-foreground mb-6">
                A barbearia oficial ainda não foi configurada. Execute a migração SQL no Supabase para marcar a Imperio Barber como oficial.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="premium" 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/registro-barbeiro")}
                  className="w-full"
                >
                  Cadastrar Barbearia
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Para outras barbearias, tentar recuperar o último slug válido
    const lastValidSlug = localStorage.getItem("origin_barbershop_slug");
    
    // Se o slug atual é diferente do último válido, tentar navegar para o último válido
    if (lastValidSlug && lastValidSlug !== slug) {
      navigate(`/b/${lastValidSlug}`, { replace: true });
      return null;
    }
    
    // Se não há slug válido ou é o mesmo, mostrar erro amigável
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Barbearia não encontrada</h2>
            <p className="text-muted-foreground mb-6">
              Não foi possível carregar os dados da barbearia.
            </p>
            <Button 
              variant="premium" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <BarbershopProvider slug={isOfficial ? undefined : slug} isOfficial={isOfficial}>
      <BarbershopMetaTags />
      <Outlet />
    </BarbershopProvider>
  );
};

export default BarbershopLayout;
