import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Loader2 } from "lucide-react";

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Check if user came from a barbershop route (check both keys for compatibility)
  const originSlug = sessionStorage.getItem("origin_barbershop_slug") || sessionStorage.getItem("auth_origin_slug");

  // Fetch barbershop info if we have an origin slug
  const { data: originBarbershop } = useQuery({
    queryKey: ["auth-origin-barbershop", originSlug],
    queryFn: async () => {
      if (!originSlug) return null;
      const { data } = await supabase
        .from("barbershops")
        .select("name, logo_url, slug")
        .eq("slug", originSlug)
        .maybeSingle();
      return data;
    },
    enabled: !!originSlug,
  });

  // Redirect if already logged in - back to origin barbershop if available
  useEffect(() => {
    if (user && !loading) {
      if (originSlug) {
        // NÃO remover originSlug - manter para permitir re-login na mesma barbearia
        navigate(`/b/${originSlug}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, originSlug]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, show nothing while redirecting
  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(loginEmail, loginPassword);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(signupEmail, signupPassword, signupFullName, signupPhone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {originBarbershop?.logo_url ? (
            <img 
              src={originBarbershop.logo_url} 
              alt={originBarbershop.name} 
              className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            />
          ) : (
            <div className="w-32 h-32 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <Crown className="w-16 h-16 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Crown className="text-primary" />
            {originBarbershop?.name || "Barbearia"}
          </h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Entre com sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="premium" className="w-full" size="lg">
                    Entrar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>Cadastre-se para agendar</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="premium" className="w-full" size="lg">
                    Criar Conta
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            É barbeiro?
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/registro-barbeiro")}
            className="w-full"
          >
            <Crown className="w-4 h-4 mr-2" />
            Criar Barbearia
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
