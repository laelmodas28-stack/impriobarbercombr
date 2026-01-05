import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserRole } from "@/hooks/useUserRole";
import { TutorialViewer } from "@/components/TutorialViewer";

interface TutorialItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface TutorialCategory {
  id: string;
  title: string;
  icon: string;
  tutorials: TutorialItem[];
}

// Tutoriais estáticos com screenshots reais do sistema
const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    icon: '🚀',
    tutorials: [
      {
        id: 'dashboard-overview',
        title: 'Visão Geral do Dashboard',
        description: 'Conheça o painel principal com métricas e resumos do seu negócio',
        image_url: '/tutorials/dashboard.png'
      },
      {
        id: 'navegacao-painel',
        title: 'Navegação do Painel',
        description: 'Aprenda a navegar entre as seções do painel administrativo',
        image_url: '/tutorials/navegacao.png'
      }
    ]
  },
  {
    id: 'agendamentos',
    title: 'Agendamentos',
    icon: '📅',
    tutorials: [
      {
        id: 'lista-agendamentos',
        title: 'Lista de Agendamentos',
        description: 'Visualize e gerencie todos os agendamentos da sua barbearia',
        image_url: '/tutorials/agendamentos.png'
      },
      {
        id: 'confirmar-cancelar',
        title: 'Confirmar ou Cancelar',
        description: 'Saiba como confirmar ou cancelar um agendamento',
        image_url: '/tutorials/confirmar-agendamento.png'
      },
      {
        id: 'notificacoes-agendamento',
        title: 'Notificações Automáticas',
        description: 'Configure lembretes automáticos para seus clientes',
        image_url: '/tutorials/notificacoes.png'
      }
    ]
  },
  {
    id: 'profissionais',
    title: 'Profissionais',
    icon: '👤',
    tutorials: [
      {
        id: 'cadastrar-profissional',
        title: 'Cadastrar Profissional',
        description: 'Adicione novos barbeiros à sua equipe',
        image_url: '/tutorials/profissionais.png'
      },
      {
        id: 'gerenciar-equipe',
        title: 'Gerenciar Equipe',
        description: 'Edite informações e gerencie a disponibilidade dos profissionais',
        image_url: '/tutorials/gerenciar-equipe.png'
      }
    ]
  },
  {
    id: 'servicos',
    title: 'Serviços',
    icon: '✂️',
    tutorials: [
      {
        id: 'adicionar-servico',
        title: 'Adicionar Serviço',
        description: 'Crie novos serviços oferecidos pela sua barbearia',
        image_url: '/tutorials/servicos.png'
      },
      {
        id: 'precos-duracao',
        title: 'Preços e Duração',
        description: 'Configure valores e tempo de cada serviço',
        image_url: '/tutorials/precos-servicos.png'
      }
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: '💰',
    tutorials: [
      {
        id: 'dashboard-financeiro',
        title: 'Dashboard Financeiro',
        description: 'Acompanhe receitas e desempenho financeiro',
        image_url: '/tutorials/financeiro.png'
      },
      {
        id: 'filtrar-periodo',
        title: 'Filtrar por Período',
        description: 'Analise resultados por semana, mês ou período personalizado',
        image_url: '/tutorials/filtrar-financeiro.png'
      }
    ]
  },
  {
    id: 'assinaturas',
    title: 'Assinaturas',
    icon: '⭐',
    tutorials: [
      {
        id: 'criar-plano',
        title: 'Criar Plano de Assinatura',
        description: 'Configure planos recorrentes para fidelizar clientes',
        image_url: '/tutorials/assinaturas.png'
      },
      {
        id: 'gerenciar-assinantes',
        title: 'Gerenciar Assinantes',
        description: 'Acompanhe e gerencie os clientes assinantes',
        image_url: '/tutorials/gerenciar-assinaturas.png'
      }
    ]
  },
  {
    id: 'personalizacao',
    title: 'Personalização',
    icon: '🎨',
    tutorials: [
      {
        id: 'logo-nome',
        title: 'Logo e Nome',
        description: 'Personalize a identidade visual da sua barbearia',
        image_url: '/tutorials/personalizacao.png'
      },
      {
        id: 'redes-sociais',
        title: 'Redes Sociais e Contato',
        description: 'Configure links para suas redes e informações de contato',
        image_url: '/tutorials/redes-sociais.png'
      }
    ]
  }
];

const TutorialCard = ({ 
  tutorial, 
  onClick 
}: { 
  tutorial: TutorialItem; 
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-card/50 rounded-lg p-3 hover:bg-card/80 transition-all border border-border/50 hover:border-primary/30"
    >
      <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden flex items-center justify-center">
        <img 
          src={tutorial.image_url} 
          alt={tutorial.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `
              <div class="flex flex-col items-center gap-2 text-muted-foreground p-4">
                <span class="text-2xl">📸</span>
                <span class="text-xs text-center">Screenshot em breve</span>
              </div>
            `;
          }}
        />
      </div>
      <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
        {tutorial.title}
      </h4>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {tutorial.description}
      </p>
    </div>
  );
};

export const TutorialGuide = () => {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Only show for admins
  if (roleLoading || (!isAdmin && !isSuperAdmin)) {
    return null;
  }

  const allTutorials = TUTORIAL_CATEGORIES.flatMap(c => c.tutorials);
  const currentIndex = selectedTutorial ? allTutorials.findIndex(t => t.id === selectedTutorial.id) : -1;

  const handleTutorialClick = (tutorial: TutorialItem) => {
    setSelectedTutorial(tutorial);
    setViewerOpen(true);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (currentIndex === -1) return;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < allTutorials.length) {
      setSelectedTutorial(allTutorials[newIndex]);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Sheet>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-primary/10 text-foreground"
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Guia da Plataforma</p>
            </TooltipContent>
          </Tooltip>

          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                Guia da Plataforma
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                Tutoriais visuais para ajudar você a configurar sua barbearia
              </p>
            </SheetHeader>

            <Accordion type="single" collapsible className="space-y-2" defaultValue="primeiros-passos">
              {TUTORIAL_CATEGORIES.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border border-border/50 rounded-lg px-4 bg-card/30"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div className="text-left">
                        <span className="font-medium text-foreground">
                          {category.title}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({category.tutorials.length} tutoriais)
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {category.tutorials.map((tutorial) => (
                        <TutorialCard
                          key={tutorial.id}
                          tutorial={tutorial}
                          onClick={() => handleTutorialClick(tutorial)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                💡 Clique em um tutorial para ver a imagem em tamanho maior
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </TooltipProvider>

      <TutorialViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        tutorial={selectedTutorial}
        onNavigate={handleNavigate}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < allTutorials.length - 1}
      />
    </>
  );
};
