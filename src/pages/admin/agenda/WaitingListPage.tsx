import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Plus, Phone, Calendar, User, CheckCircle, XCircle, Loader2, Trash2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WaitingListEntry {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_id: string | null;
  service_id: string | null;
  professional_id: string | null;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  services?: { name: string } | null;
  professionals?: { name: string } | null;
}

const STATUS_CONFIG = {
  waiting: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  contacted: { label: "Contatado", color: "bg-blue-500/20 text-blue-500", icon: Phone },
  scheduled: { label: "Agendado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-500", icon: XCircle },
};

export function WaitingListPage() {
  const { barbershop } = useBarbershopContext();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    service_id: "",
    professional_id: "",
    preferred_date: "",
    preferred_time_start: "",
    preferred_time_end: "",
    notes: "",
  });

  const { data: waitingList, isLoading } = useQuery({
    queryKey: ["waiting-list", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("waiting_list")
        .select(`
          *,
          services(name),
          professionals(name)
        `)
        .eq("barbershop_id", barbershop.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WaitingListEntry[];
    },
    enabled: !!barbershop?.id,
  });

  const { data: services } = useQuery({
    queryKey: ["services-list", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  const { data: professionals } = useQuery({
    queryKey: ["professionals-list", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!barbershop?.id) throw new Error("Barbearia não encontrada");
      const { error } = await supabase.from("waiting_list").insert({
        barbershop_id: barbershop.id,
        client_name: formData.client_name,
        client_phone: formData.client_phone || null,
        service_id: formData.service_id || null,
        professional_id: formData.professional_id || null,
        preferred_date: formData.preferred_date || null,
        preferred_time_start: formData.preferred_time_start || null,
        preferred_time_end: formData.preferred_time_end || null,
        notes: formData.notes || null,
        status: "waiting",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente adicionado à lista de espera!");
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar à lista");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("waiting_list")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waiting_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrada removida!");
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover");
    },
  });

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      service_id: "",
      professional_id: "",
      preferred_date: "",
      preferred_time_start: "",
      preferred_time_end: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    addMutation.mutate();
  };

  const stats = {
    waiting: waitingList?.filter(w => w.status === "waiting").length || 0,
    contacted: waitingList?.filter(w => w.status === "contacted").length || 0,
    scheduled: waitingList?.filter(w => w.status === "scheduled").length || 0,
    total: waitingList?.length || 0,
  };

  if (!barbershop?.id) {
    return <AdminPageScaffold title="Lista de Espera" subtitle="Clientes aguardando disponibilidade" icon={Clock} />;
  }

  return (
    <AdminPageScaffold
      title="Lista de Espera"
      subtitle="Clientes aguardando disponibilidade de horário"
      icon={Clock}
      actions={
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar à Lista
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.waiting}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contacted}</p>
                  <p className="text-sm text-muted-foreground">Contatados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduled}</p>
                  <p className="text-sm text-muted-foreground">Agendados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waiting List Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes na Lista</CardTitle>
            <CardDescription>Gerencie os clientes aguardando disponibilidade</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : waitingList && waitingList.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Preferência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Adicionado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitingList.map((entry) => {
                      const statusConfig = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.waiting;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.client_name}</p>
                              {entry.client_phone && (
                                <p className="text-sm text-muted-foreground">{entry.client_phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{entry.services?.name || "-"}</TableCell>
                          <TableCell>{entry.professionals?.name || "Qualquer"}</TableCell>
                          <TableCell>
                            {entry.preferred_date ? (
                              <div className="text-sm">
                                <p>{format(new Date(entry.preferred_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                                {entry.preferred_time_start && (
                                  <p className="text-muted-foreground">
                                    {entry.preferred_time_start}
                                    {entry.preferred_time_end && ` - ${entry.preferred_time_end}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Flexível</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={entry.status}
                              onValueChange={(value) => updateStatusMutation.mutate({ id: entry.id, status: value })}
                            >
                              <SelectTrigger className="w-32">
                                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="w-3 h-3" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`tel:${entry.client_phone}`}>
                                  <Phone className="w-4 h-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Remover da lista de espera?")) {
                                    deleteMutation.mutate(entry.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">Lista de espera vazia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione clientes que desejam ser notificados quando houver disponibilidade
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Lista de Espera</DialogTitle>
            <DialogDescription>
              Registre um cliente que deseja ser notificado sobre disponibilidade
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome do Cliente *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_phone">Telefone</Label>
              <Input
                id="client_phone"
                value={formData.client_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, service_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select
                  value={formData.professional_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, professional_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals?.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data Preferencial</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário Inicial</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_time_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Final</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_time_end: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageScaffold>
  );
}

export default WaitingListPage;
