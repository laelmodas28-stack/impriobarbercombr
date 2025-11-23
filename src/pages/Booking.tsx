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
import { format } from "date-fns";
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
        .select("*")
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
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00"
  ];

  const handleBooking = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const service = services?.find(s => s.id === selectedService);
    if (!service) return;

    try {
      const { error } = await supabase.from("bookings").insert({
        client_id: user.id,
        service_id: selectedService,
        professional_id: selectedProfessional,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        total_price: service.price,
        notes: notes,
        status: "pending"
      });

      if (error) throw error;

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
                    disabled={(date) => date < new Date()}
                    className="rounded-md border border-border mx-auto"
                    locale={ptBR}
                  />
                </div>
                
                <div>
                  <Label className="mb-3 block">Horário</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
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
