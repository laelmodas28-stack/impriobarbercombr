import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tags, Plus, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  client_count?: number;
}

interface SegmentFormData {
  name: string;
  color: string;
  description: string;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6366f1", // indigo
  "#64748b", // slate
];

const defaultFormData: SegmentFormData = {
  name: "",
  color: "#6366f1",
  description: "",
};

export function ClientSegmentsPage() {
  const { barbershop } = useBarbershopContext();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteSegment, setDeleteSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState<SegmentFormData>(defaultFormData);

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["admin-client-segments", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("client_segments")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name");
      if (error) throw error;

      // Get client count for each segment
      const segmentsWithCount = await Promise.all(
        data.map(async (segment) => {
          const { count } = await supabase
            .from("client_segment_assignments")
            .select("*", { count: "exact", head: true })
            .eq("segment_id", segment.id);
          return { ...segment, client_count: count || 0 };
        })
      );

      return segmentsWithCount as Segment[];
    },
    enabled: !!barbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: SegmentFormData) => {
      if (!barbershop?.id) throw new Error("Barbearia não encontrada");
      const { error } = await supabase.from("client_segments").insert({
        barbershop_id: barbershop.id,
        name: data.name,
        color: data.color,
        description: data.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segmento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-client-segments"] });
      handleCloseSheet();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao criar segmento");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SegmentFormData }) => {
      const { error } = await supabase
        .from("client_segments")
        .update({
          name: data.name,
          color: data.color,
          description: data.description || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segmento atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-client-segments"] });
      handleCloseSheet();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar segmento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segmento removido!");
      queryClient.invalidateQueries({ queryKey: ["admin-client-segments"] });
      setDeleteSegment(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao remover segmento");
    },
  });

  const handleOpenCreate = () => {
    setEditingSegment(null);
    setFormData(defaultFormData);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      color: segment.color,
      description: segment.description || "",
    });
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingSegment(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Informe o nome do segmento");
      return;
    }
    if (editingSegment) {
      updateMutation.mutate({ id: editingSegment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Segmentos" subtitle="Tags e segmentação de clientes" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segmentos"
        subtitle="Tags e segmentação de clientes para campanhas e análises"
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Segmento
          </Button>
        }
      />

      {segments.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum segmento criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie segmentos para organizar seus clientes por categoria, frequência ou preferências.
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Segmento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card
              key={segment.id}
              className="card-elevated cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenEdit(segment)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: segment.color + "20" }}
                    >
                      <Tags className="h-5 w-5" style={{ color: segment.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {segment.client_count} clientes
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(segment);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSegment(segment);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {segment.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {segment.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingSegment ? "Editar Segmento" : "Novo Segmento"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: VIP, Novo, Inativo..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descreva este segmento..."
                rows={3}
              />
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={handleCloseSheet}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSegment ? "Salvar" : "Criar"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSegment} onOpenChange={() => setDeleteSegment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Segmento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteSegment?.name}"? Os clientes
              associados a este segmento serão desvinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSegment && deleteMutation.mutate(deleteSegment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ClientSegmentsPage;
