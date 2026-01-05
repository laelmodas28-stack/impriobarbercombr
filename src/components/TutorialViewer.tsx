import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface TutorialImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

interface TutorialViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorial: TutorialImage | null;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const TutorialViewer = ({
  open,
  onOpenChange,
  tutorial,
  onNavigate,
  hasPrev,
  hasNext,
}: TutorialViewerProps) => {
  if (!tutorial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-background/95 backdrop-blur-sm border-border">
        <DialogTitle className="sr-only">{tutorial.title}</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{tutorial.title}</h3>
            {tutorial.description && (
              <p className="text-sm text-muted-foreground">{tutorial.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="relative flex items-center justify-center p-4 min-h-[400px] max-h-[70vh]">
          {tutorial.image_url && (
            <img
              src={tutorial.image_url}
              alt={tutorial.title}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
            />
          )}

          {/* Navigation Arrows */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('prev')}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('next')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onNavigate('prev')}
            disabled={!hasPrev}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
            className="gap-2"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
