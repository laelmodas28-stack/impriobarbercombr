import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Bell, 
  Smartphone,
  CreditCard,
  ChevronLeft, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tourSteps = [
  {
    icon: Calendar,
    title: "Agendamento Online 24/7",
    description: "Seus clientes agendam a qualquer hora, direto do celular. Confirmação automática por WhatsApp e email.",
    features: [
      "Calendário inteligente com disponibilidade em tempo real",
      "Bloqueio automático de horários ocupados",
      "Reagendamento fácil pelo cliente"
    ],
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Users,
    title: "Gestão de Equipe Completa",
    description: "Controle profissionais, escalas de trabalho e comissões de forma simples e organizada.",
    features: [
      "Perfil individual para cada barbeiro",
      "Cálculo automático de comissões",
      "Relatório de desempenho por profissional"
    ],
    color: "from-green-500 to-green-600"
  },
  {
    icon: BarChart3,
    title: "Dashboard Financeiro",
    description: "Acompanhe faturamento, serviços mais vendidos e tendências do seu negócio em tempo real.",
    features: [
      "Gráficos de receita diária/semanal/mensal",
      "Análise de serviços mais populares",
      "Exportação de relatórios"
    ],
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Bell,
    title: "Notificações Inteligentes",
    description: "Reduza faltas com lembretes automáticos e mantenha sua agenda sempre cheia.",
    features: [
      "Lembrete 24h e 1h antes do horário",
      "Notificação de novos agendamentos",
      "Alertas de cancelamento"
    ],
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Smartphone,
    title: "Seu App Personalizado",
    description: "Sua barbearia com identidade própria: logo, cores e link exclusivo para compartilhar.",
    features: [
      "Link personalizado (suabarbearia.imperioapp.com)",
      "Logo e cores da sua marca",
      "Funciona em qualquer dispositivo"
    ],
    color: "from-pink-500 to-pink-600"
  },
  {
    icon: CreditCard,
    title: "Planos de Assinatura",
    description: "Crie planos mensais para fidelizar clientes e garantir receita recorrente.",
    features: [
      "Crie planos com benefícios exclusivos",
      "Pagamento integrado com Mercado Pago",
      "Gestão automática de assinaturas"
    ],
    color: "from-amber-500 to-amber-600"
  }
];

export function DemoTour({ open, onOpenChange }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = tourSteps[currentStep];
  const Icon = step.icon;
  
  const goNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                index === currentStep 
                  ? "bg-primary" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="sr-only">Tour do ImperioApp</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Icon with gradient background */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br",
            step.color
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Title and description */}
          <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          {/* Features list */}
          <ul className="space-y-3 mb-8">
            {step.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} de {tourSteps.length}
            </span>

            {currentStep === tourSteps.length - 1 ? (
              <Button onClick={handleClose} variant="premium" className="gap-2">
                Começar Agora
              </Button>
            ) : (
              <Button onClick={goNext} className="gap-2">
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
