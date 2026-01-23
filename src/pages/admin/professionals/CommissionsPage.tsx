import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Percent,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Settings,
  BarChart3,
  CalendarIcon,
  Filter,
  Download,
  Edit,
  Check,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type PeriodFilter = "today" | "week" | "month" | "year" | "custom";
type PaymentStatus = "all" | "paid" | "pending";

export function CommissionsPage() {
  const { barbershop } = useBarbershopContext();
  const queryClient = useQueryClient();
  
  // Filter states
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [professionalFilter, setProfessionalFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  
  // Dialog states
  const [editRateDialogOpen, setEditRateDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [newRate, setNewRate] = useState("");
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Calculate date range based on period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return {
          start: customDateRange.from || startOfMonth(now),
          end: customDateRange.to || endOfMonth(now),
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodFilter, customDateRange]);

  // Fetch professionals
  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["professionals-commissions", barbershop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershop!.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  // Fetch commission rates
  const { data: commissionRates = [] } = useQuery({
    queryKey: ["commission-rates", barbershop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_commissions")
        .select("*")
        .eq("barbershop_id", barbershop!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  // Fetch bookings for commission calculation
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings-commissions", barbershop?.id, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:professionals(id, name, photo_url),
          service:services(id, name, price)
        `)
        .eq("barbershop_id", barbershop!.id)
        .eq("status", "completed")
        .gte("booking_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.end, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  // Fetch commission payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["commission-payments", barbershop?.id, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_payments")
        .select(`
          *,
          professional:professionals(id, name, photo_url)
        `)
        .eq("barbershop_id", barbershop!.id)
        .gte("period_start", format(dateRange.start, "yyyy-MM-dd"))
        .lte("period_end", format(dateRange.end, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  // Update commission rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async ({ professionalId, rate }: { professionalId: string; rate: number }) => {
      const existingRate = commissionRates.find(r => r.professional_id === professionalId);
      
      if (existingRate) {
        const { error } = await supabase
          .from("professional_commissions")
          .update({ commission_rate: rate, updated_at: new Date().toISOString() })
          .eq("id", existingRate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("professional_commissions")
          .insert({
            professional_id: professionalId,
            barbershop_id: barbershop!.id,
            commission_rate: rate,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rates"] });
      toast.success("Taxa de comissão atualizada!");
      setEditRateDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar taxa");
    },
  });

  // Mark payment as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("commission_payments")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
      toast.success("Pagamento marcado como pago!");
      setMarkPaidDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar pagamento");
    },
  });

  // Get commission rate for a professional
  const getCommissionRate = (professionalId: string): number => {
    const rate = commissionRates.find(r => r.professional_id === professionalId);
    return rate?.commission_rate || 50;
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    let filteredBookings = bookings;
    let filteredPayments = payments;

    if (professionalFilter !== "all") {
      filteredBookings = bookings.filter(b => b.professional_id === professionalFilter);
      filteredPayments = payments.filter(p => p.professional_id === professionalFilter);
    }

    if (statusFilter !== "all") {
      filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
    }

    const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
    
    const totalCommission = filteredBookings.reduce((sum, b) => {
      const rate = getCommissionRate(b.professional_id);
      const value = Number(b.total_price || b.price || 0);
      return sum + (value * rate / 100);
    }, 0);

    const paidPayments = filteredPayments.filter(p => p.status === "paid");
    const pendingPayments = filteredPayments.filter(p => p.status === "pending");

    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0);

    return {
      totalRevenue,
      totalCommission,
      totalPaid,
      totalPending,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
    };
  }, [bookings, payments, professionalFilter, statusFilter, commissionRates]);

  // Chart data - by professional
  const chartByProfessional = useMemo(() => {
    const data: { name: string; comissao: number; faturamento: number }[] = [];
    
    professionals.forEach(prof => {
      const profBookings = bookings.filter(b => b.professional_id === prof.id);
      const revenue = profBookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
      const rate = getCommissionRate(prof.id);
      const commission = revenue * rate / 100;
      
      if (revenue > 0) {
        data.push({
          name: prof.name.split(" ")[0],
          comissao: commission,
          faturamento: revenue,
        });
      }
    });

    return data.sort((a, b) => b.comissao - a.comissao);
  }, [professionals, bookings, commissionRates]);

  // Chart data - payment status pie
  const chartPaymentStatus = useMemo(() => {
    return [
      { name: "Pago", value: metrics.totalPaid, fill: "hsl(var(--chart-2))" },
      { name: "Pendente", value: metrics.totalPending, fill: "hsl(var(--chart-4))" },
    ].filter(d => d.value > 0);
  }, [metrics]);

  // Chart data - by period (daily aggregation for the selected range)
  const chartByPeriod = useMemo(() => {
    const dailyData: Record<string, { date: string; comissao: number; faturamento: number }> = {};
    
    bookings.forEach(booking => {
      const date = booking.booking_date;
      if (!dailyData[date]) {
        dailyData[date] = { date, comissao: 0, faturamento: 0 };
      }
      const revenue = Number(booking.total_price || booking.price || 0);
      const rate = getCommissionRate(booking.professional_id);
      dailyData[date].faturamento += revenue;
      dailyData[date].comissao += revenue * rate / 100;
    });

    return Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: format(new Date(d.date), periodFilter === "year" ? "MMM" : "dd/MM", { locale: ptBR }),
      }));
  }, [bookings, commissionRates, periodFilter]);

  // Filtered payments for table
  const filteredPaymentsTable = useMemo(() => {
    let filtered = payments;
    
    if (professionalFilter !== "all") {
      filtered = filtered.filter(p => p.professional_id === professionalFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    return filtered;
  }, [payments, professionalFilter, statusFilter]);

  const isLoading = professionalsLoading || bookingsLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comissões" subtitle="Gestão de comissões dos profissionais" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        subtitle="Gestão completa de comissões dos profissionais"
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Period Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {periodFilter === "custom" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Datas</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-[120px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from ? format(customDateRange.from, "dd/MM/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-[120px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.to ? format(customDateRange.to, "dd/MM/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Professional Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">
                  R$ {metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-2/10">
                <Percent className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Comissões</p>
                <p className="text-2xl font-bold">
                  R$ {metrics.totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos ({metrics.paidCount})</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {metrics.totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes ({metrics.pendingCount})</p>
                <p className="text-2xl font-bold text-amber-600">
                  R$ {metrics.totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="h-4 w-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Charts */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar Chart - By Professional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comissões por Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                {chartByProfessional.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartByProfessional} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                        <YAxis type="category" dataKey="name" width={80} className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="comissao" fill="hsl(var(--primary))" radius={4} name="Comissão" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Sem dados para exibir</p>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status dos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPaymentStatus.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartPaymentStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartPaymentStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Sem dados para exibir</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Chart - By Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução no Período</CardTitle>
            </CardHeader>
            <CardContent>
              {chartByPeriod.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis tickFormatter={(v) => `R$${v}`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                        contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Faturamento" dot={false} />
                      <Line type="monotone" dataKey="comissao" stroke="hsl(var(--primary))" strokeWidth={2} name="Comissão" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">Sem dados para exibir</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPaymentsTable.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Valor Bruto</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentsTable.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={payment.professional?.photo_url || ""} />
                              <AvatarFallback>
                                {payment.professional?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{payment.professional?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.period_start), "dd/MM")} - {format(new Date(payment.period_end), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {Number(payment.gross_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">{payment.commission_rate}%</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(payment.commission_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                            {payment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setMarkPaidDialogOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          {payment.status === "paid" && payment.paid_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(payment.paid_at), "dd/MM/yy")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Nenhum pagamento encontrado para os filtros selecionados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taxas de Comissão por Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professionals.map((prof) => {
                  const rate = getCommissionRate(prof.id);
                  const rateRecord = commissionRates.find(r => r.professional_id === prof.id);
                  
                  return (
                    <div
                      key={prof.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={prof.photo_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {prof.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{prof.name}</p>
                          {rateRecord?.updated_at && (
                            <p className="text-xs text-muted-foreground">
                              Atualizado em {format(new Date(rateRecord.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{rate}%</p>
                          <p className="text-xs text-muted-foreground">comissão</p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedProfessional(prof);
                            setNewRate(rate.toString());
                            setEditRateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Rate Dialog */}
      <Dialog open={editRateDialogOpen} onOpenChange={setEditRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Taxa de Comissão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedProfessional?.photo_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedProfessional?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedProfessional?.name}</p>
                <p className="text-sm text-muted-foreground">Profissional</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="text-2xl font-bold"
                />
                <span className="text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                O profissional receberá {newRate || 0}% do valor de cada serviço realizado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedProfessional && newRate) {
                  updateRateMutation.mutate({
                    professionalId: selectedProfessional.id,
                    rate: parseFloat(newRate),
                  });
                }
              }}
              disabled={updateRateMutation.isPending}
            >
              {updateRateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Deseja marcar este pagamento como pago?
            </p>
            {selectedPayment && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <p><strong>Profissional:</strong> {selectedPayment.professional?.name}</p>
                <p><strong>Valor:</strong> R$ {Number(selectedPayment.commission_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p><strong>Período:</strong> {format(new Date(selectedPayment.period_start), "dd/MM")} - {format(new Date(selectedPayment.period_end), "dd/MM/yy")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedPayment) {
                  markPaidMutation.mutate(selectedPayment.id);
                }
              }}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommissionsPage;
