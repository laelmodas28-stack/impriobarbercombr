import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { UserCircle, Star, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useBarbershop } from "@/hooks/useBarbershop";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ProfessionalForm from "@/components/admin/ProfessionalForm";

export function ProfessionalsListPage() {
  const { barbershop } = useBarbershop();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: professionals, isLoading, refetch } = useQuery({
    queryKey: ["professionals", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir profissional");
    } else {
      toast.success("Profissional excluído");
      refetch();
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    refetch();
  };

  return (
    <>
      <AdminPageScaffold
        title="Equipe"
        subtitle="Profissionais cadastrados na barbearia"
        icon={UserCircle}
        actionLabel="Novo Profissional"
        onAction={() => setIsModalOpen(true)}
      >
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((prof) => (
              <Card key={prof.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={prof.photo_url || undefined} />
                        <AvatarFallback>{prof.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{prof.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {prof.rating?.toFixed(1) || "5.0"}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(prof.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {prof.specialties && prof.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {prof.specialties.slice(0, 3).map((spec, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Badge 
                    variant={prof.is_active ? "default" : "outline"} 
                    className="mt-3"
                  >
                    {prof.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum profissional cadastrado</p>
              <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                Adicionar Primeiro Profissional
              </Button>
            </CardContent>
          </Card>
        )}
      </AdminPageScaffold>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Profissional</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProfessionalForm onSuccess={handleSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ProfessionalsListPage;
