import { useState, useEffect } from "react";
import { BookOpen, ChevronRight, Loader2, RefreshCw, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TutorialViewer } from "@/components/TutorialViewer";

interface TutorialImage {
  id: string;
  category_id: string;
  tutorial_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  step_order: number;
}

interface TutorialCategory {
  id: string;
  title: string;
  tutorials: TutorialImage[];
}

const CATEGORY_INFO: Record<string, { title: string; icon: string }> = {
  'primeiros-passos': { title: '🚀 Primeiros Passos', icon: '🚀' },
  'agendamentos': { title: '📅 Agendamentos', icon: '📅' },
  'profissionais': { title: '👤 Profissionais', icon: '👤' },
  'servicos': { title: '✂️ Serviços', icon: '✂️' },
  'financeiro': { title: '💰 Financeiro', icon: '💰' },
  'dashboard': { title: '📊 Dashboard', icon: '📊' },
  'assinatura': { title: '⭐ Assinaturas', icon: '⭐' },
  'personalizacao': { title: '🎨 Personalização', icon: '🎨' },
};

const TutorialCard = ({ 
  tutorial, 
  onClick 
}: { 
  tutorial: TutorialImage; 
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-card/50 rounded-lg p-3 hover:bg-card/80 transition-all border border-border/50 hover:border-primary/30"
    >
      <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden flex items-center justify-center">
        {tutorial.image_url ? (
          <img 
            src={tutorial.image_url} 
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Image className="h-8 w-8" />
            <span className="text-xs">Aguardando geração</span>
          </div>
        )}
      </div>
      <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
        {tutorial.title}
      </h4>
      {tutorial.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {tutorial.description}
        </p>
      )}
    </div>
  );
};

export const TutorialGuide = () => {
  const { barbershop } = useBarbershopContext();
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const [tutorials, setTutorials] = useState<TutorialImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialImage | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchTutorials = async () => {
    if (!barbershop?.id) return;

    try {
      const { data, error } = await supabase
        .from('tutorial_images')
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .order('category_id')
        .order('step_order');

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, [barbershop?.id]);

  const generateTutorials = async () => {
    if (!barbershop?.id) return;

    setGenerating(true);
    toast.info('Gerando imagens de tutorial... Isso pode levar alguns minutos.');

    try {
      const { data, error } = await supabase.functions.invoke('generate-tutorial-images', {
        body: { barbershop_id: barbershop.id }
      });

      if (error) throw error;

      toast.success(`${data.generated} de ${data.total} imagens geradas com sucesso!`);
      fetchTutorials();
    } catch (error: any) {
      console.error('Error generating tutorials:', error);
      toast.error('Erro ao gerar tutoriais: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleTutorialClick = (tutorial: TutorialImage) => {
    if (tutorial.image_url) {
      setSelectedTutorial(tutorial);
      setViewerOpen(true);
    }
  };

  const categories: TutorialCategory[] = Object.entries(CATEGORY_INFO).map(([id, info]) => ({
    id,
    title: info.title,
    tutorials: tutorials.filter(t => t.category_id === id).sort((a, b) => a.step_order - b.step_order)
  })).filter(cat => cat.tutorials.length > 0 || tutorials.length === 0);

  // Only show for admins
  if (roleLoading || (!isAdmin && !isSuperAdmin)) {
    return null;
  }

  const allTutorials = categories.flatMap(c => c.tutorials);
  const currentIndex = selectedTutorial ? allTutorials.findIndex(t => t.id === selectedTutorial.id) : -1;

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

            {/* Generate Button */}
            <div className="mb-6">
              <Button
                onClick={generateTutorials}
                disabled={generating}
                className="w-full"
                variant={tutorials.length > 0 ? "outline" : "default"}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando imagens...
                  </>
                ) : tutorials.length > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar Tutoriais
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Gerar Tutoriais com IA
                  </>
                )}
              </Button>
              {tutorials.length === 0 && !generating && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Clique para gerar 19 imagens explicativas automaticamente
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tutorials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tutorial disponível ainda.</p>
                <p className="text-sm mt-2">Clique no botão acima para gerar!</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {categories.map((category) => (
                  <AccordionItem
                    key={category.id}
                    value={category.id}
                    className="border border-border/50 rounded-lg px-4 bg-card/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{CATEGORY_INFO[category.id]?.icon}</span>
                        <div className="text-left">
                          <span className="font-medium text-foreground">
                            {CATEGORY_INFO[category.id]?.title.replace(/^.+\s/, '')}
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
            )}
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
