import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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

  // Redirecionar admin para sua barbearia
  useEffect(() => {
    if (!authLoading && !barbershopLoading && userBarbershop?.slug) {
      navigate(`/b/${userBarbershop.slug}`);
    }
  }, [authLoading, barbershopLoading, userBarbershop, navigate]);

  if (authLoading || barbershopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;