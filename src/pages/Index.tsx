import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Ler slug de origem de forma síncrona para evitar race condition
  const originSlug = sessionStorage.getItem("origin_barbershop_slug");

  // Redirecionamento imediato se usuário logado veio de uma barbearia
  // Executar ANTES de qualquer outra lógica para evitar flash da tela genérica
  useEffect(() => {
    if (!authLoading && user && originSlug) {
      navigate(`/b/${originSlug}`, { replace: true });
    }
  }, [authLoading, user, originSlug, navigate]);

  // Buscar barbearia do usuário (se for admin)
  const { data: userBarbershop, isLoading: barbershopLoading } = useQuery({
    queryKey: ["user-barbershop", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Verificar se é admin de alguma barbearia
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("barbershop_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .not("barbershop_id", "is", null)
        .maybeSingle();

      if (userRole?.barbershop_id) {
        const { data: barbershop } = await supabase
          .from("barbershops")
          .select("slug")
          .eq("id", userRole.barbershop_id)
          .maybeSingle();
        
        return barbershop;
      }

      return null;
    },
    enabled: !!user,
  });

  // Redirecionar: admin para sua barbearia
  // Cliente com originSlug já é tratado no useEffect acima
  useEffect(() => {
    if (!authLoading && !barbershopLoading) {
      if (userBarbershop?.slug) {
        navigate(`/b/${userBarbershop.slug}`, { replace: true });
      }
    }
  }, [authLoading, barbershopLoading, userBarbershop, navigate]);

  const handleBackToBarbershop = () => {
    if (originSlug) {
      navigate(`/b/${originSlug}`);
    }
  };

  // BLOQUEIO ABSOLUTO: Se usuário logado com originSlug, SEMPRE mostra loader
  // Nunca renderiza a página "Sistema de Barbearias" para clientes de barbearias
  if (user && originSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Loading state durante verificação de auth ou busca de barbearia do admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se usuário está logado e é admin, esperar carregar dados da barbearia
  if (user && barbershopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Botão Voltar se houver origem */}
        {originSlug && (
          <Button 
            variant="ghost" 
            onClick={handleBackToBarbershop}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Barbearia
          </Button>
        )}

        <Crown className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-bold mb-4">Sistema de Barbearias</h1>
        <p className="text-muted-foreground mb-8">
          Gerencie sua barbearia ou acesse como cliente
        </p>

        <div className="space-y-4">
          {!user ? (
            <>
              <Button 
                variant="premium" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Entrar
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/registro-barbeiro")}
              >
                Cadastrar Barbearia
              </Button>
            </>
          ) : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Olá!</CardTitle>
                <CardDescription>
                  Você está logado, mas não tem uma barbearia associada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="premium" 
                  className="w-full"
                  onClick={() => navigate("/registro-barbeiro")}
                >
                  Criar Minha Barbearia
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/account")}
                >
                  Minha Conta
                </Button>
                {originSlug && (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleBackToBarbershop}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Barbearia
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;