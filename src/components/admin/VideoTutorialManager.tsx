import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Video, GripVertical } from "lucide-react";

interface TutorialVideo {
  id: string;
  category_id: string;
  category_title: string;
  category_icon: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

interface VideoTutorialManagerProps {
  barbershopId: string;
}

const CATEGORY_OPTIONS = [
  { id: "primeiros-passos", title: "1. Primeiros Passos", icon: "🚀" },
  { id: "agendamentos", title: "2. Agendamentos", icon: "📅" },
  { id: "profissionais-servicos", title: "3. Profissionais e Serviços", icon: "✂️" },
  { id: "financeiro", title: "4. Financeiro", icon: "💰" },
  { id: "dashboard", title: "5. Dashboard", icon: "📊" },
  { id: "assinatura", title: "6. Assinatura", icon: "🔄" },
  { id: "personalizacao", title: "7. Personalização", icon: "🎨" },
];

export const VideoTutorialManager = ({ barbershopId }: VideoTutorialManagerProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);
  
  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["tutorial-videos", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorial_videos")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("category_id")
        .order("display_order");
      
      if (error) throw error;
      return data as TutorialVideo[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (videoData: Partial<TutorialVideo>) => {
      const category = CATEGORY_OPTIONS.find(c => c.id === videoData.category_id);
      
      if (editingVideo) {
        const { error } = await supabase
          .from("tutorial_videos")
          .update({
            category_id: videoData.category_id,
            category_title: category?.title || "",
            category_icon: category?.icon || "🎬",
            title: videoData.title,
            description: videoData.description,
            video_url: videoData.video_url,
            duration: videoData.duration,
            is_active: videoData.is_active,
            display_order: videoData.display_order,
          })
          .eq("id", editingVideo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tutorial_videos")
          .insert({
            barbershop_id: barbershopId,
            category_id: videoData.category_id!,
            category_title: category?.title || "",
            category_icon: category?.icon || "🎬",
            title: videoData.title!,
            description: videoData.description,
            video_url: videoData.video_url,
            duration: videoData.duration,
            is_active: videoData.is_active,
            display_order: videoData.display_order,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingVideo ? "Vídeo atualizado!" : "Vídeo adicionado!");
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos", barbershopId] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar vídeo: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("tutorial_videos")
        .delete()
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo removido!");
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos", barbershopId] });
    },
    onError: (error) => {
      toast.error("Erro ao remover vídeo: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingVideo(null);
    setCategoryId("");
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setDuration("");
    setIsActive(true);
  };

  const handleEdit = (video: TutorialVideo) => {
    setEditingVideo(video);
    setCategoryId(video.category_id);
    setTitle(video.title);
    setDescription(video.description || "");
    setVideoUrl(video.video_url || "");
    setDuration(video.duration || "");
    setIsActive(video.is_active ?? true);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId || !title) {
      toast.error("Preencha categoria e título");
      return;
    }

    saveMutation.mutate({
      category_id: categoryId,
      title,
      description: description || null,
      video_url: videoUrl || null,
      duration: duration || null,
      is_active: isActive,
      display_order: videos?.length || 0,
    });
  };

  // Group videos by category
  const videosByCategory = videos?.reduce((acc, video) => {
    if (!acc[video.category_id]) {
      acc[video.category_id] = {
        title: video.category_title,
        icon: video.category_icon,
        videos: [],
      };
    }
    acc[video.category_id].videos.push(video);
    return acc;
  }, {} as Record<string, { title: string; icon: string; videos: TutorialVideo[] }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Tutoriais em Vídeo
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os vídeos tutoriais que aparecem para os administradores
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Editar Vídeo" : "Adicionar Vídeo Tutorial"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Como criar um agendamento"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição do conteúdo do vídeo"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>URL do Vídeo (YouTube/Vimeo)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label>Duração</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 5:30"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : !videos?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum vídeo tutorial cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Vídeo" para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(videosByCategory || {}).map(([catId, category]) => (
            <Card key={catId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.title}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({category.videos.length} vídeo{category.videos.length > 1 ? "s" : ""})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {category.videos.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      video.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      {video.description && (
                        <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                      )}
                    </div>
                    {video.duration && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {video.duration}
                      </span>
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Remover este vídeo?")) {
                            deleteMutation.mutate(video.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
