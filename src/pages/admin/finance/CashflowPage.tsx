import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CashflowEntry {
  date: Date;
  type: "entrada" | "saida";
  description: string;
  amount: number;
  category: string;
}

export function CashflowPage() {
  const { barbershop } = useBarbershopContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch bookings (revenue)
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["cashflow-bookings", barbershop?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          price,
          booking_date,
          status,
          service:services(name)
        `)
        .eq("barbershop_id", barbershop.id)
        .eq("status", "completed")
        .gte("booking_date", format(monthStart, "yyyy-MM-dd"))
        .lte("booking_date", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch subscriptions (revenue)
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["cashflow-subscriptions", barbershop?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("client_subscriptions")
        .select(`
          id,
          started_at,
          plan:subscription_plans(name, price)
        `)
        .eq("barbershop_id", barbershop.id)
        .gte("started_at", monthStart.toISOString())
        .lte("started_at", monthEnd.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  // Fetch commission payments (expenses)
  const { data: commissionPayments, isLoading: loadingCommissions } = useQuery({
    queryKey: ["cashflow-commissions", barbershop?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("commission_payments")
        .select(`
          id,
          amount,
          paid_at,
          status,
          professional:professionals!inner(barbershop_id, name)
        `)
        .eq("professional.barbershop_id", barbershop.id)
        .eq("status", "paid")
        .gte("paid_at", monthStart.toISOString())
        .lte("paid_at", monthEnd.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  const isLoading = loadingBookings || loadingSubscriptions || loadingCommissions;

  // Build cashflow entries
  const cashflowEntries = useMemo(() => {
    const entries: CashflowEntry[] = [];

    // Add booking revenue
    bookings?.forEach(booking => {
      entries.push({
        date: new Date(booking.booking_date),
        type: "entrada",
        description: booking.service?.name || "Atendimento",
        amount: Number(booking.price || 0),
        category: "Serviços",
      });
    });

    // Add subscription revenue
    subscriptions?.forEach(sub => {
      entries.push({
        date: new Date(sub.started_at),
        type: "entrada",
        description: `Assinatura: ${sub.plan?.name}`,
        amount: Number(sub.plan?.price || 0),
        category: "Assinaturas",
      });
    });

    // Add commission payments (expenses)
    commissionPayments?.forEach(payment => {
      if (payment.paid_at) {
        entries.push({
          date: new Date(payment.paid_at),
          type: "saida",
          description: `Comissão: ${payment.professional?.name}`,
          amount: Number(payment.amount || 0),
          category: "Comissões",
        });
      }
    });

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [bookings, subscriptions, commissionPayments]);

  // Calculate totals
  const totalEntradas = cashflowEntries
    .filter(e => e.type === "entrada")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSaidas = cashflowEntries
    .filter(e => e.type === "saida")
    .reduce((sum, e) => sum + e.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  // Build chart data
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const chartData = useMemo(() => {
    let runningBalance = 0;
    
    return daysInMonth.map(day => {
      const dayEntries = cashflowEntries.filter(e => isSameDay(e.date, day));
      const dayEntradas = dayEntries.filter(e => e.type === "entrada").reduce((sum, e) => sum + e.amount, 0);
      const daySaidas = dayEntries.filter(e => e.type === "saida").reduce((sum, e) => sum + e.amount, 0);
      
      runningBalance += dayEntradas - daySaidas;
      
      return {
        date: format(day, "dd", { locale: ptBR }),
        fullDate: format(day, "dd/MM", { locale: ptBR }),
        entradas: dayEntradas,
        saidas: daySaidas,
        saldo: runningBalance,
      };
    });
  }, [daysInMonth, cashflowEntries]);

  // Group entries by category
  const entriesByCategory = useMemo(() => {
    const grouped: Record<string, { entradas: number; saidas: number }> = {};
    
    cashflowEntries.forEach(entry => {
      if (!grouped[entry.category]) {
        grouped[entry.category] = { entradas: 0, saidas: 0 };
      }
      if (entry.type === "entrada") {
        grouped[entry.category].entradas += entry.amount;
      } else {
        grouped[entry.category].saidas += entry.amount;
      }
    });
    
    return grouped;
  }, [cashflowEntries]);

  const handlePreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const handleExport = () => {
    const csv = [
      ["Data", "Tipo", "Categoria", "Descrição", "Valor"].join(","),
      ...cashflowEntries.map(e => [
        format(e.date, "dd/MM/yyyy"),
        e.type === "entrada" ? "Entrada" : "Saída",
        e.category,
        e.description,
        e.amount.toFixed(2),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxo-caixa-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
  };

  return (
    <AdminPageScaffold
      title="Fluxo de Caixa"
      subtitle="Entradas e saídas financeiras"
      icon={TrendingUp}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <Calendar className="h-4 w-4" />
          </Button>
          <Select 
            value={format(selectedMonth, "yyyy-MM")} 
            onValueChange={(v) => setSelectedMonth(new Date(v + "-01"))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = subMonths(new Date(), i);
                return (
                  <SelectItem key={i} value={format(month, "yyyy-MM")}>
                    {format(month, "MMMM yyyy", { locale: ptBR })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="text-2xl font-bold text-green-500">
                      R$ {totalEntradas.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Saídas</p>
                    <p className="text-2xl font-bold text-red-500">
                      R$ {totalSaidas.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={saldo >= 0 ? "border-primary/20" : "border-red-500/20"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo do Período</p>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? "text-primary" : "text-red-500"}`}>
                      R$ {saldo.toFixed(2)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${saldo >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}>
                    {saldo >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-primary" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo - {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                      formatter={(value: number, name: string) => [
                        `R$ ${value.toFixed(2)}`, 
                        name === "saldo" ? "Saldo Acumulado" : name === "entradas" ? "Entradas" : "Saídas"
                      ]}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorSaldo)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(entriesByCategory).map(([category, values]) => (
                  <div key={category} className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">{category}</h4>
                    <div className="space-y-1 text-sm">
                      {values.entradas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entradas:</span>
                          <span className="text-green-500">+ R$ {values.entradas.toFixed(2)}</span>
                        </div>
                      )}
                      {values.saidas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saídas:</span>
                          <span className="text-red-500">- R$ {values.saidas.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações do Período</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cashflowEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma movimentação</h3>
                  <p className="text-muted-foreground">
                    Não há entradas ou saídas registradas neste período
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashflowEntries.slice(0, 50).map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(entry.date, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={entry.type === "entrada" 
                              ? "text-green-500 border-green-500" 
                              : "text-red-500 border-red-500"
                            }
                          >
                            {entry.type === "entrada" ? "Entrada" : "Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.category}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className={`text-right font-medium ${entry.type === "entrada" ? "text-green-500" : "text-red-500"}`}>
                          {entry.type === "entrada" ? "+" : "-"} R$ {entry.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageScaffold>
  );
}

export default CashflowPage;
