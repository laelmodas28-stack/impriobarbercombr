import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type Period = "today" | "week" | "month" | "quarter" | "year";

export function FinanceOverviewPage() {
  const { barbershop } = useBarbershopContext();
  const [period, setPeriod] = useState<Period>("month");

  const getDateRange = (p: Period) => {
    const now = new Date();
    switch (p) {
      case "today":
        return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "week":
        return { 
          start: format(startOfWeek(now, { locale: ptBR }), "yyyy-MM-dd"), 
          end: format(endOfWeek(now, { locale: ptBR }), "yyyy-MM-dd") 
        };
      case "month":
        return { 
          start: format(startOfMonth(now), "yyyy-MM-dd"), 
          end: format(endOfMonth(now), "yyyy-MM-dd") 
        };
      case "quarter":
        return { 
          start: format(subMonths(now, 3), "yyyy-MM-dd"), 
          end: format(now, "yyyy-MM-dd") 
        };
      case "year":
        return { 
          start: format(subMonths(now, 12), "yyyy-MM-dd"), 
          end: format(now, "yyyy-MM-dd") 
        };
    }
  };

  const dateRange = getDateRange(period);

  // Fetch bookings for revenue
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["finance-bookings", barbershop?.id, dateRange],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:professionals(name),
          service:services(name)
        `)
        .eq("barbershop_id", barbershop.id)
        .gte("booking_date", dateRange.start)
        .lte("booking_date", dateRange.end);
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch payment transactions
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["finance-transactions", barbershop?.id, dateRange],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end + "T23:59:59");
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch commission payments (payouts)
  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ["finance-payouts", barbershop?.id, dateRange],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("commission_payments")
        .select(`
          *,
          professional:professionals!inner(barbershop_id, name)
        `)
        .eq("professional.barbershop_id", barbershop.id)
        .gte("period_start", dateRange.start)
        .lte("period_end", dateRange.end);
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["finance-subscriptions", barbershop?.id, dateRange],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("client_subscriptions")
        .select(`
          *,
          plan:subscription_plans(name, price)
        `)
        .eq("barbershop_id", barbershop.id)
        .gte("started_at", dateRange.start)
        .lte("started_at", dateRange.end + "T23:59:59");
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  const isLoading = loadingBookings || loadingTransactions || loadingPayouts || loadingSubscriptions;

  // Calculate metrics
  const completedBookings = bookings?.filter(b => b.status === "completed") || [];
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled") || [];
  
  const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const subscriptionRevenue = subscriptions?.reduce((sum, s) => sum + Number(s.plan?.price || 0), 0) || 0;
  const totalPayouts = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const pendingPayouts = payouts?.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  
  const grossRevenue = totalRevenue + subscriptionRevenue;
  const netRevenue = grossRevenue - totalPayouts;
  const averageTicket = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
  const cancellationRate = bookings?.length ? (cancelledBookings.length / bookings.length) * 100 : 0;

  // Revenue by service
  const revenueByService = completedBookings.reduce((acc, booking) => {
    const serviceName = booking.service?.name || "Outros";
    acc[serviceName] = (acc[serviceName] || 0) + Number(booking.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const serviceChartData = Object.entries(revenueByService)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Revenue by professional
  const revenueByProfessional = completedBookings.reduce((acc, booking) => {
    const profName = booking.professional?.name || "Outros";
    acc[profName] = (acc[profName] || 0) + Number(booking.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const professionalChartData = Object.entries(revenueByProfessional)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Daily revenue for chart
  const dailyRevenue = completedBookings.reduce((acc, booking) => {
    const date = booking.booking_date;
    acc[date] = (acc[date] || 0) + Number(booking.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const dailyChartData = Object.entries(dailyRevenue)
    .map(([date, value]) => ({ 
      date: format(new Date(date), "dd/MM", { locale: ptBR }), 
      faturamento: value 
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendLabel,
    variant = "default" 
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    trend?: number;
    trendLabel?: string;
    variant?: "default" | "success" | "warning" | "danger";
  }) => {
    const variantStyles = {
      default: "bg-card",
      success: "bg-green-500/10 border-green-500/20",
      warning: "bg-yellow-500/10 border-yellow-500/20",
      danger: "bg-red-500/10 border-red-500/20",
    };

    return (
      <Card className={variantStyles[variant]}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {trend >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminPageScaffold
      title="Visão Geral Financeira"
      subtitle="Resumo financeiro da barbearia"
      icon={Wallet}
      actions={
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Receita Bruta"
              value={`R$ ${grossRevenue.toFixed(2)}`}
              icon={DollarSign}
              variant="success"
            />
            <MetricCard
              title="Receita Líquida"
              value={`R$ ${netRevenue.toFixed(2)}`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Ticket Médio"
              value={`R$ ${averageTicket.toFixed(2)}`}
              icon={CreditCard}
            />
            <MetricCard
              title="Atendimentos"
              value={completedBookings.length.toString()}
              icon={Calendar}
            />
          </div>

          {/* Secondary metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Assinaturas</p>
                    <p className="text-xl font-bold mt-1">R$ {subscriptionRevenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscriptions?.length || 0} ativas no período
                    </p>
                  </div>
                  <Badge variant="secondary">{subscriptions?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                    <p className="text-xl font-bold mt-1">R$ {totalPayouts.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      R$ {pendingPayouts.toFixed(2)} pendentes
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    {payouts?.length || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Cancelamento</p>
                    <p className="text-xl font-bold mt-1">{cancellationRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cancelledBookings.length} de {bookings?.length || 0} agendamentos
                    </p>
                  </div>
                  <Badge 
                    variant={cancellationRate > 10 ? "destructive" : "secondary"}
                  >
                    {cancelledBookings.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList>
              <TabsTrigger value="revenue">Faturamento</TabsTrigger>
              <TabsTrigger value="services">Por Serviço</TabsTrigger>
              <TabsTrigger value="professionals">Por Profissional</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Faturamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          />
                          <YAxis 
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            tickFormatter={(v) => `R$${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Faturamento"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="faturamento" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {serviceChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professionals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  {professionalChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={professionalChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            type="number"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            tickFormatter={(v) => `R$${v}`}
                          />
                          <YAxis 
                            type="category"
                            dataKey="name"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            width={100}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="hsl(var(--primary))" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminPageScaffold>
  );
}

export default FinanceOverviewPage;
