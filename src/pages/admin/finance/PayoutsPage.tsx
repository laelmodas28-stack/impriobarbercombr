import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type PayoutStatus = "all" | "pending" | "paid";

export function PayoutsPage() {
  const { barbershop } = useBarbershopContext();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<PayoutStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmPayDialogOpen, setConfirmPayDialogOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  
  // Form state for new payout
  const [newPayout, setNewPayout] = useState({
    professional_id: "",
    amount: "",
    period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  // Fetch professionals
  const { data: professionals } = useQuery({
    queryKey: ["professionals", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch commission payments
  const { data: payouts, isLoading } = useQuery({
    queryKey: ["payouts", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("commission_payments")
        .select(`
          *,
          professional:professionals!inner(id, name, photo_url, barbershop_id)
        `)
        .eq("professional.barbershop_id", barbershop.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch pending commissions to calculate suggested payouts
  const { data: pendingCommissions } = useQuery({
    queryKey: ["pending-commissions", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("professional_commissions")
        .select(`
          *,
          professional:professionals!inner(id, name, barbershop_id),
          booking:bookings(booking_date)
        `)
        .eq("professional.barbershop_id", barbershop.id)
        .eq("status", "pending");
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Calculate pending amounts by professional
  const pendingByProfessional = pendingCommissions?.reduce((acc, comm) => {
    const profId = comm.professional?.id;
    if (profId) {
      acc[profId] = (acc[profId] || 0) + Number(comm.amount || 0);
    }
    return acc;
  }, {} as Record<string, number>) || {};

  // Create payout mutation
  const createPayoutMutation = useMutation({
    mutationFn: async (data: typeof newPayout) => {
      const { error } = await supabase
        .from("commission_payments")
        .insert({
          professional_id: data.professional_id,
          amount: parseFloat(data.amount),
          period_start: data.period_start,
          period_end: data.period_end,
          status: "pending",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      setCreateDialogOpen(false);
      setNewPayout({
        professional_id: "",
        amount: "",
        period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
      });
      toast.success("Pagamento registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const { error } = await supabase
        .from("commission_payments")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString() 
        })
        .eq("id", payoutId);
      if (error) throw error;

      // Also update related professional commissions as paid
      const payout = payouts?.find(p => p.id === payoutId);
      if (payout) {
        await supabase
          .from("professional_commissions")
          .update({ status: "paid" })
          .eq("professional_id", payout.professional_id)
          .eq("status", "pending");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-commissions"] });
      setConfirmPayDialogOpen(false);
      setSelectedPayoutId(null);
      toast.success("Pagamento confirmado!");
    },
    onError: (error) => {
      toast.error("Erro ao confirmar pagamento: " + error.message);
    },
  });

  const filteredPayouts = payouts?.filter(p => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  }) || [];

  const totalPending = payouts?.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalPaid = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const handleProfessionalSelect = (profId: string) => {
    setNewPayout(prev => ({
      ...prev,
      professional_id: profId,
      amount: pendingByProfessional[profId]?.toString() || "",
    }));
  };

  return (
    <AdminPageScaffold
      title="Pagamentos"
      subtitle="Pagamentos realizados a profissionais"
      icon={CreditCard}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    R$ {totalPending.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagos (Total)</p>
                  <p className="text-2xl font-bold text-green-500">
                    R$ {totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comissões a Pagar</p>
                  <p className="text-2xl font-bold">
                    R$ {Object.values(pendingByProfessional).reduce((a, b) => a + b, 0).toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Commissions by Professional */}
        {Object.keys(pendingByProfessional).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Comissões Pendentes por Profissional
              </CardTitle>
              <CardDescription>
                Valores acumulados que ainda não foram pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {professionals?.filter(p => pendingByProfessional[p.id]).map(prof => (
                  <div key={prof.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={prof.photo_url || undefined} />
                        <AvatarFallback>{prof.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{prof.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pendingCommissions?.filter(c => c.professional?.id === prof.id).length} atendimentos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-500">
                        R$ {pendingByProfessional[prof.id].toFixed(2)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-1"
                        onClick={() => {
                          handleProfessionalSelect(prof.id);
                          setCreateDialogOpen(true);
                        }}
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayoutStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payouts Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Nenhum pagamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Registre pagamentos de comissões para os profissionais
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pagamento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={payout.professional?.photo_url || undefined} />
                            <AvatarFallback>
                              {payout.professional?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{payout.professional?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(payout.period_start), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p className="text-muted-foreground">
                            até {format(new Date(payout.period_end), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {Number(payout.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payout.status === "paid" ? (
                          <Badge className="bg-green-500/20 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.paid_at 
                          ? format(new Date(payout.paid_at), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayoutId(payout.id);
                              setConfirmPayDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Payout Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento de comissão para um profissional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select 
                value={newPayout.professional_id} 
                onValueChange={handleProfessionalSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals?.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {prof.name}
                        {pendingByProfessional[prof.id] && (
                          <span className="text-xs text-muted-foreground">
                            (R$ {pendingByProfessional[prof.id].toFixed(2)} pendente)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newPayout.amount}
                onChange={(e) => setNewPayout(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início do Período</Label>
                <Input
                  type="date"
                  value={newPayout.period_start}
                  onChange={(e) => setNewPayout(prev => ({ ...prev, period_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim do Período</Label>
                <Input
                  type="date"
                  value={newPayout.period_end}
                  onChange={(e) => setNewPayout(prev => ({ ...prev, period_end: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createPayoutMutation.mutate(newPayout)}
              disabled={!newPayout.professional_id || !newPayout.amount || createPayoutMutation.isPending}
            >
              {createPayoutMutation.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmPayDialogOpen} onOpenChange={setConfirmPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Deseja marcar este pagamento como realizado? Esta ação também atualizará as comissões relacionadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedPayoutId && markAsPaidMutation.mutate(selectedPayoutId)}
              disabled={markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageScaffold>
  );
}

export default PayoutsPage;
