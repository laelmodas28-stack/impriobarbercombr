import { Video, Play, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
}

interface TutorialCategory {
  id: string;
  title: string;
  icon: string;
  videos: TutorialVideo[];
}

const tutorialCategories: TutorialCategory[] = [
  {
    id: "primeiros-passos",
    title: "1. Primeiros Passos",
    icon: "🚀",
    videos: [
      {
        id: "intro-1",
        title: "Como funciona a plataforma Império Barber",
        description: "Conheça a plataforma completa e suas funcionalidades principais",
        videoUrl: "", // URL do YouTube/Vimeo será adicionada depois
        duration: "5:30",
      },
      {
        id: "intro-2",
        title: "Visão geral do painel administrativo",
        description: "Tour completo pelo painel de administração",
        videoUrl: "",
        duration: "4:15",
      },
    ],
  },
  {
    id: "agendamentos",
    title: "2. Agendamentos",
    icon: "📅",
    videos: [
      {
        id: "agenda-1",
        title: "Como criar e gerenciar agendamentos",
        description: "Aprenda a criar, editar e cancelar agendamentos",
        videoUrl: "",
        duration: "6:00",
      },
      {
        id: "agenda-2",
        title: "O que acontece após um agendamento",
        description: "Fluxo completo após a confirmação do cliente",
        videoUrl: "",
        duration: "3:45",
      },
      {
        id: "agenda-3",
        title: "Como funciona o sino de notificações",
        description: "Entenda as notificações e alertas do sistema",
        videoUrl: "",
        duration: "2:30",
      },
    ],
  },
  {
    id: "profissionais-servicos",
    title: "3. Profissionais e Serviços",
    icon: "✂️",
    videos: [
      {
        id: "prof-1",
        title: "Como cadastrar profissionais",
        description: "Adicione sua equipe de barbeiros à plataforma",
        videoUrl: "",
        duration: "4:00",
      },
      {
        id: "prof-2",
        title: "Como cadastrar serviços",
        description: "Crie e configure os serviços oferecidos",
        videoUrl: "",
        duration: "5:15",
      },
      {
        id: "prof-3",
        title: "Definir duração e valores",
        description: "Configure tempos e preços dos serviços",
        videoUrl: "",
        duration: "3:30",
      },
    ],
  },
  {
    id: "financeiro",
    title: "4. Financeiro",
    icon: "💰",
    videos: [
      {
        id: "fin-1",
        title: "Como visualizar fluxo financeiro",
        description: "Entenda o painel de finanças completo",
        videoUrl: "",
        duration: "5:45",
      },
      {
        id: "fin-2",
        title: "Filtrar por dia, mês e ano",
        description: "Use os filtros para análises detalhadas",
        videoUrl: "",
        duration: "3:00",
      },
      {
        id: "fin-3",
        title: "Identificar melhores dias e meses",
        description: "Análise de performance temporal",
        videoUrl: "",
        duration: "4:30",
      },
    ],
  },
  {
    id: "dashboard",
    title: "5. Dashboard",
    icon: "📊",
    videos: [
      {
        id: "dash-1",
        title: "Como interpretar os dados do dashboard",
        description: "Métricas e indicadores importantes",
        videoUrl: "",
        duration: "6:30",
      },
      {
        id: "dash-2",
        title: "Entradas, saídas e indicadores",
        description: "Acompanhe a saúde financeira do negócio",
        videoUrl: "",
        duration: "4:00",
      },
    ],
  },
  {
    id: "assinatura",
    title: "6. Assinatura",
    icon: "🔄",
    videos: [
      {
        id: "sub-1",
        title: "Como cadastrar ou alterar assinatura",
        description: "Gerencie planos de assinatura de clientes",
        videoUrl: "",
        duration: "5:00",
      },
      {
        id: "sub-2",
        title: "Status da assinatura",
        description: "Entenda os diferentes status",
        videoUrl: "",
        duration: "2:45",
      },
      {
        id: "sub-3",
        title: "O que acontece quando expira",
        description: "Processo de expiração e renovação",
        videoUrl: "",
        duration: "3:15",
      },
    ],
  },
  {
    id: "personalizacao",
    title: "7. Personalização da Barbearia",
    icon: "🎨",
    videos: [
      {
        id: "custom-1",
        title: "Como adicionar logo, endereço e horário",
        description: "Configure as informações básicas",
        videoUrl: "",
        duration: "4:30",
      },
      {
        id: "custom-2",
        title: "Como configurar redes sociais",
        description: "Conecte Instagram, TikTok e WhatsApp",
        videoUrl: "",
        duration: "3:00",
      },
      {
        id: "custom-3",
        title: "Como personalizar a página da barbearia",
        description: "Deixe sua página com a cara do seu negócio",
        videoUrl: "",
        duration: "5:30",
      },
    ],
  },
];

const VideoCard = ({ video }: { video: TutorialVideo }) => {
  const handlePlayVideo = () => {
    if (video.videoUrl) {
      window.open(video.videoUrl, "_blank");
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
      onClick={handlePlayVideo}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Play className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">
          {video.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {video.description}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className="text-xs">
          {video.duration}
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};

export const VideoTutorials = () => {
  const { barbershop } = useBarbershopContext();
  const { isAdmin } = useUserRole(barbershop?.id);

  // Só exibe para administradores
  if (!isAdmin) {
    return null;
  }

  const totalVideos = tutorialCategories.reduce(
    (acc, cat) => acc + cat.videos.length,
    0
  );

  return (
    <TooltipProvider>
      <Sheet>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Video className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tutoriais da Plataforma</p>
          </TooltipContent>
        </Tooltip>

        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">Tutoriais em Vídeo</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {totalVideos} vídeos • Aprenda a usar a plataforma
                </p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] mt-4 pr-4">
            <Accordion type="single" collapsible className="space-y-2">
              {tutorialCategories.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div className="text-left">
                        <span className="font-medium">{category.title}</span>
                        <p className="text-xs text-muted-foreground font-normal">
                          {category.videos.length} vídeo
                          {category.videos.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-2">
                      {category.videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                💡 Os vídeos serão adicionados em breve. Fique atento às
                atualizações!
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};
