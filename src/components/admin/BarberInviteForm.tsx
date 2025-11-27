import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface BarberInviteFormProps {
  barbershopId: string;
  onSuccess: () => void;
}

export const BarberInviteForm = ({ barbershopId, onSuccess }: BarberInviteFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error("Preencha email e nome do barbeiro");
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar se o email já está cadastrado
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", email)
        .single();

      if (existingUser) {
        // Se usuário já existe, apenas conectar como profissional
        const { data: professional, error: profError } = await supabase
          .from("professionals")
          .insert({
            barbershop_id: barbershopId,
            name: name,
            user_id: existingUser.id,
            is_active: true,
          })
          .select()
          .single();

        if (profError) throw profError;

        // Adicionar role de barber
        await supabase.from("user_roles").insert({
          user_id: existingUser.id,
          role: "barber",
          barbershop_id: barbershopId,
        });

        toast.success("Barbeiro conectado com sucesso!");
      } else {
        toast.info("Enviando convite para o email: " + email);
        toast.info(
          "O barbeiro deve criar uma conta usando este email. Depois, você pode conectá-lo aqui.",
          { duration: 5000 }
        );
        
        // Salvar como profissional sem user_id (será conectado depois)
        await supabase
          .from("professionals")
          .insert({
            barbershop_id: barbershopId,
            name: name,
            is_active: false, // Inativo até criar conta
          });

        toast.success("Barbeiro adicionado! Aguardando cadastro.");
      }

      setEmail("");
      setName("");
      setPhone("");
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao convidar barbeiro:", error);
      toast.error("Erro ao processar convite: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Adicionar Barbeiro
        </CardTitle>
        <CardDescription>
          Convide um barbeiro para trabalhar na sua barbearia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barber-email">Email do Barbeiro *</Label>
            <Input
              id="barber-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barbeiro@email.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              O barbeiro deve criar uma conta usando este email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barber-name">Nome Completo *</Label>
            <Input
              id="barber-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do Barbeiro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barber-phone">Telefone (opcional)</Label>
            <Input
              id="barber-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+5511999999999"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Processando..." : "Convidar Barbeiro"}
          </Button>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Como funciona:</strong>
            </p>
            <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Digite o email e nome do barbeiro</li>
              <li>O barbeiro deve criar uma conta em "Cadastrar" usando este email</li>
              <li>Após criar a conta, ele terá acesso ao sistema como barbeiro</li>
              <li>Você pode gerenciar os barbeiros na aba "Profissionais"</li>
            </ol>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
