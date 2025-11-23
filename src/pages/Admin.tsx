import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Scissors, Settings } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings, refetch: refetchBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, phone),
          service:services(name),
          professional:professionals(name)
        `)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  const { data: professionals } = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  if (!user || profile?.role !== "admin") {
    navigate("/");
    return null;
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Status atualizado com sucesso");
      refetchBookings();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      case "completed":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "";
    }
  };

  const todayBookings = bookings?.filter(
    b => b.booking_date === format(new Date(), "yyyy-MM-dd")
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie sua barbearia</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="professionals">
              <Users className="w-4 h-4 mr-2" />
              Profissionais
            </TabsTrigger>
            <TabsTrigger value="services">
              <Scissors className="w-4 h-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Agendamentos */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <CardDescription>
                  {todayBookings?.length || 0} agendamentos para hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayBookings && todayBookings.length > 0 ? (
                  <div className="space-y-4">
                    {todayBookings.map((booking) => (
                      <Card key={booking.id} className="border-border bg-card/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-lg">{booking.client?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{booking.client?.phone}</p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <p><span className="text-muted-foreground">Serviço:</span> {booking.service?.name}</p>
                            <p><span className="text-muted-foreground">Profissional:</span> {booking.professional?.name}</p>
                            <p><span className="text-muted-foreground">Horário:</span> {booking.booking_time}</p>
                            <p><span className="text-muted-foreground">Valor:</span> R$ {booking.total_price}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              disabled={booking.status === "confirmed"}
                            >
                              Confirmar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              disabled={booking.status === "completed"}
                            >
                              Concluir
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              disabled={booking.status === "cancelled"}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum agendamento para hoje
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Todos os Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookings?.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 bg-card/30 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-semibold">{booking.client?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.booking_date), "dd/MM/yyyy", { locale: ptBR })} às {booking.booking_time}
                        </p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profissionais */}
          <TabsContent value="professionals">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Profissionais Cadastrados</CardTitle>
                <CardDescription>
                  Total: {professionals?.length || 0} profissionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {professionals?.map((professional) => (
                    <Card key={professional.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg">{professional.name}</p>
                            <p className="text-sm text-muted-foreground mb-2">{professional.bio}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-semibold">⭐ {professional.rating}</span>
                              <Badge variant={professional.is_active ? "default" : "secondary"}>
                                {professional.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Serviços */}
          <TabsContent value="services">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Serviços Disponíveis</CardTitle>
                <CardDescription>
                  Total: {services?.length || 0} serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {services?.map((service) => (
                    <Card key={service.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-lg">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <p className="text-sm mt-2">
                              <span className="text-primary font-bold">R$ {service.price}</span>
                              <span className="text-muted-foreground ml-2">• {service.duration_minutes} min</span>
                            </p>
                          </div>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Configurações da Barbearia</CardTitle>
                <CardDescription>
                  Gerencie as informações da barbearia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Para editar as informações da barbearia, acesse a aba Cloud no painel do Lovable.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
