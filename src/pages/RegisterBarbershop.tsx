import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import imperioLogo from "@/assets/imperio-logo.webp";
import { z } from "zod";
import { Crown, Store, User, ArrowLeft } from "lucide-react";

// Validation schema (accessCode is now required)
const formSchema = z.object({
  accessCode: z.string().min(6, "Código de acesso é obrigatório").max(50, "Código muito longo"),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
  fullName: z.string().min(2, "Nome muito curto").max(100),
  phone: z.string().regex(/^\d{10,15}$/, "Telefone inválido (10-15 dígitos)").optional().or(z.literal("")),
  barbershopName: z.string().min(2, "Nome da barbearia muito curto").max(100),
  address: z.string().max(200).optional(),
  description: z.string().max(500).optional()
});

const RegisterBarbershop = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Código de Acesso
  const [accessCode, setAccessCode] = useState("");
  
  // Dados do Proprietário
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Dados da Barbearia
  const [barbershopName, setBarbershopName] = useState("");
  const [barbershopAddress, setBarbershopAddress] = useState("");
  const [barbershopDescription, setBarbershopDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (ownerPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    // Validação com zod
    try {
      formSchema.parse({
        accessCode: accessCode.trim().toUpperCase(),
        email: ownerEmail,
        password: ownerPassword,
        fullName: ownerName,
        phone: ownerPhone,
        barbershopName,
        address: barbershopAddress,
        description: barbershopDescription
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Chamar edge function para criar tudo (com código de acesso obrigatório)
      const { data, error } = await supabase.functions.invoke('register-barbershop', {
        body: {
          code: accessCode.trim().toUpperCase(),
          owner: {
            full_name: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            password: ownerPassword,
          },
          barbershop: {
            name: barbershopName,
            address: barbershopAddress || null,
            description: barbershopDescription || null,
          }
        }
      });
      
      if (error) {
        console.error('Error registering barbershop:', error);
        toast.error(error.message || "Erro ao criar barbearia. Tente novamente.");
        setLoading(false);
        return;
      }
      
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      
      // Fazer login automático
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password: ownerPassword,
      });
      
      if (signInError) {
        toast.error("Barbearia criada! Faça login para continuar.");
        navigate("/auth");
        return;
      }
      
      toast.success("Barbearia criada com sucesso!");
      navigate("/admin");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Erro ao criar barbearia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para página principal
        </Button>
        <div className="text-center mb-8">
          <img 
            src={imperioLogo} 
            alt="IMPÉRIO BARBER" 
            className="w-24 h-24 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          />
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Crown className="text-primary" />
            Criar Barbearia
          </h1>
          <p className="text-muted-foreground mt-2">
            Cadastre sua barbearia e comece a gerenciar agendamentos
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Registro de Barbearia</CardTitle>
            <CardDescription>Preencha os dados abaixo para criar sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Código de Acesso */}
              <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="access-code" className="text-base font-semibold">
                    Código de Acesso *
                  </Label>
                  <Input
                    id="access-code"
                    type="text"
                    placeholder="Ex: BARBER2024"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="uppercase font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Você precisa de um código de acesso válido para criar uma barbearia. 
                    Entre em contato com o administrador para obter um código.
                  </p>
                </div>
              </div>

              {/* Dados do Proprietário */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="w-5 h-5 text-primary" />
                  <h3>Dados do Proprietário</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="owner-name">Nome Completo *</Label>
                  <Input
                    id="owner-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="owner-email">Email *</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="owner-phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="owner-phone"
                    type="tel"
                    placeholder="11980757862"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: DDD + número (ex: 11980757862)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="owner-password">Senha *</Label>
                  <Input
                    id="owner-password"
                    type="password"
                    placeholder="••••••••"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Dados da Barbearia */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Store className="w-5 h-5 text-primary" />
                  <h3>Dados da Barbearia</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barbershop-name">Nome da Barbearia *</Label>
                  <Input
                    id="barbershop-name"
                    type="text"
                    placeholder="Nome da sua barbearia"
                    value={barbershopName}
                    onChange={(e) => setBarbershopName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barbershop-address">Endereço</Label>
                  <Input
                    id="barbershop-address"
                    type="text"
                    placeholder="Rua, número, bairro, cidade"
                    value={barbershopAddress}
                    onChange={(e) => setBarbershopAddress(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barbershop-description">Descrição</Label>
                  <Textarea
                    id="barbershop-description"
                    placeholder="Descreva sua barbearia (opcional)"
                    value={barbershopDescription}
                    onChange={(e) => setBarbershopDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="premium" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar Barbearia"}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/auth")}
                >
                  Já tem conta? Fazer login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterBarbershop;
