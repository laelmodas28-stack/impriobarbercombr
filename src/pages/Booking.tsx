import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, isToday, getHours, getMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedService, setSelectedService] = useState(location.state?.selectedService?.id || "");
  const [selectedProfessional, setSelectedProfessional] = useState(location.state?.selectedProfessional?.id || "");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, barbershop:barbershops(id, name)")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: professionals } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*, barbershop:barbershops(id, name)")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: barbershopInfo } = useQuery({
    queryKey: ["barbershop-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_info")
        .select("opening_time, closing_time")
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Gerar slots de horário dinamicamente baseado nos horários do banco
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const openTime = barbershopInfo?.opening_time || "08:00:00";
    const closeTime = barbershopInfo?.closing_time || "19:00:00";
    
    const [openHour] = openTime.split(':').map(Number);
    const [closeHour] = closeTime.split(':').map(Number);
    
    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filtrar horários passados se for hoje
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return timeSlots;
    
    if (isToday(selectedDate)) {
      const now = new Date();
      const currentHour = getHours(now);
      const currentMinute = getMinutes(now);
      
      return timeSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        
        if (slotHour > currentHour) return true;
        if (slotHour === currentHour && slotMinute > currentMinute) return true;
        
        return false;
      });
    }
    
    return timeSlots;
  };

  const availableTimeSlots = getAvailableTimeSlots();

  const handleBooking = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const service = services?.find(s => s.id === selectedService);
    const professional = professionals?.find(p => p.id === selectedProfessional);
    
    if (!service || !professional) return;

    // Obter barbershop_id do profissional ou serviço selecionado
    const barbershopId = professional.barbershop_id || service.barbershop_id;
    
    if (!barbershopId) {
      toast.error("Erro ao identificar a barbearia");
      return;
    }

    try {
      const { data: booking, error } = await supabase.from("bookings").insert({
        client_id: user.id,
        service_id: selectedService,
        professional_id: selectedProfessional,
        barbershop_id: barbershopId,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        total_price: service.price,
        notes: notes,
        status: "pending"
      }).select().single();

      if (error) throw error;

      // Buscar dados do perfil do cliente
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      // Enviar notificação
      try {
        await supabase.functions.invoke("send-booking-notification", {
          body: {
            bookingId: booking?.id,
            clientEmail: user.email,
            clientName: profile?.full_name || "Cliente",
            clientPhone: profile?.phone,
            date: format(selectedDate, "yyyy-MM-dd"),
            time: selectedTime,
            service: service.name,
            professional: professional.name,
            price: service.price,
          },
        });
      } catch (notifError) {
        console.error("Erro ao enviar notificação:", notifError);
        // Não bloquear o agendamento se a notificação falhar
      }

      toast.success("Agendamento realizado com sucesso!");
      navigate("/account");
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    }
  };

  const selectedServiceData = services?.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Agende seu Horário</h1>
            <p className="text-muted-foreground">Escolha o serviço, profissional, data e horário</p>
          </div>

          <div className="grid gap-6">
            {/* Serviço */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>1. Escolha o Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)} ({service.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Profissional */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>2. Escolha o Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionals?.map((professional) => (
                    <Card 
                      key={professional.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedProfessional === professional.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedProfessional(professional.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                            {professional.photo_url ? (
                              <img 
                                src={professional.photo_url} 
                                alt={professional.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl text-primary-foreground">
                                {professional.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{professional.name}</p>
                            <p className="text-sm text-primary font-medium">⭐ {professional.rating}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data e Horário */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>3. Escolha Data e Horário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Data</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    className="rounded-md border border-border mx-auto"
                    locale={ptBR}
                  />
                </div>
                
                <div>
                  <Label className="mb-3 block">Horário</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedDate ? "Selecione um horário" : "Selecione uma data primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Sem horários disponíveis
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>4. Observações (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Alguma preferência ou observação..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Resumo */}
            {selectedServiceData && (
              <Card className="border-2 border-primary bg-card/50">
                <CardHeader>
                  <CardTitle>Resumo do Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-semibold">Serviço:</span> {selectedServiceData.name}</p>
                  <p><span className="font-semibold">Duração:</span> {selectedServiceData.duration_minutes} minutos</p>
                  {selectedDate && (
                    <p><span className="font-semibold">Data:</span> {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  )}
                  {selectedTime && (
                    <p><span className="font-semibold">Horário:</span> {selectedTime}</p>
                  )}
                  <p className="text-2xl font-bold text-primary pt-4">
                    Total: R$ {selectedServiceData.price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            )}

            <Button 
              variant="premium" 
              size="xl" 
              className="w-full"
              onClick={handleBooking}
              disabled={!selectedService || !selectedProfessional || !selectedDate || !selectedTime}
            >
              Confirmar Agendamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
