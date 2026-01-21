import { MessageCircle, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { useAuth } from "@/contexts/AuthContext";

const SUPPORT_WHATSAPP = "5511999999999"; // Configure your support number

export const TrialExpiredModal = () => {
  const { user } = useAuth();
  const { barbershop } = useBarbershopContext();
  const { trialExpired, isLoading, hasActiveSubscription } = useTrialStatus(barbershop?.id);

  // Only show if user is logged in, trial expired, and no subscription
  const shouldShow = !!user && trialExpired && !hasActiveSubscription && !isLoading;

  const handleSubscribeClick = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de assinar um plano para continuar usando o sistema da barbearia ${barbershop?.name || ""}. Meu período de teste expirou.`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, "_blank");
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Dialog open={shouldShow}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            Período de Teste Encerrado
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Seu período gratuito de 7 dias terminou. Para continuar utilizando 
            todos os recursos do sistema, assine um de nossos planos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Com a assinatura você terá:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Agendamentos ilimitados</li>
              <li>✓ Gestão completa de clientes</li>
              <li>✓ Relatórios financeiros</li>
              <li>✓ Notificações por WhatsApp</li>
              <li>✓ Suporte prioritário</li>
            </ul>
          </div>

          <Button
            onClick={handleSubscribeClick}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com Suporte para Assinar
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Nossa equipe está disponível para ajudá-lo a escolher o melhor plano.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
