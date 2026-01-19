import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { CalendarClock, Save, Loader2 } from "lucide-react";
import { useBarbershop } from "@/hooks/useBarbershop";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
  is_active: boolean | null;
}

interface DayAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_SCHEDULE: DayAvailability[] = DAYS_OF_WEEK.map((day) => ({
  day_of_week: day.value,
  start_time: day.value === 0 ? "09:00" : "08:00",
  end_time: day.value === 0 ? "14:00" : "18:00",
  is_available: day.value !== 0, // Sunday off by default
}));

export function AvailabilityPage() {
  const { barbershop } = useBarbershop();
  const queryClient = useQueryClient();
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<DayAvailability[]>(DEFAULT_SCHEDULE);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: professionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ["professionals", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, photo_url, is_active")
        .eq("barbershop_id", barbershop.id)
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!barbershop?.id,
  });

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["professional-availability", selectedProfessional],
    queryFn: async () => {
      if (!selectedProfessional) return null;
      const { data, error } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", selectedProfessional);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProfessional,
  });

  // Update schedule when availability data loads
  useState(() => {
    if (availability && availability.length > 0) {
      const merged = DEFAULT_SCHEDULE.map((defaultDay) => {
        const existing = availability.find((a) => a.day_of_week === defaultDay.day_of_week);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            start_time: existing.start_time.slice(0, 5),
            end_time: existing.end_time.slice(0, 5),
            is_available: existing.is_available,
          };
        }
        return defaultDay;
      });
      setSchedule(merged);
      setHasChanges(false);
    }
  });

  // Effect to load availability when professional is selected
  const handleSelectProfessional = (profId: string) => {
    setSelectedProfessional(profId);
    setHasChanges(false);
  };

  // When availability data changes, update schedule
  if (availability && availability.length > 0 && selectedProfessional) {
    const currentScheduleKey = schedule.map(s => `${s.day_of_week}-${s.start_time}-${s.end_time}-${s.is_available}`).join(',');
    const availabilitySchedule = DEFAULT_SCHEDULE.map((defaultDay) => {
      const existing = availability.find((a) => a.day_of_week === defaultDay.day_of_week);
      if (existing) {
        return {
          day_of_week: existing.day_of_week,
          start_time: existing.start_time.slice(0, 5),
          end_time: existing.end_time.slice(0, 5),
          is_available: existing.is_available,
        };
      }
      return defaultDay;
    });
    const newScheduleKey = availabilitySchedule.map(s => `${s.day_of_week}-${s.start_time}-${s.end_time}-${s.is_available}`).join(',');
    
    if (currentScheduleKey !== newScheduleKey && !hasChanges) {
      setSchedule(availabilitySchedule);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfessional) throw new Error("Nenhum profissional selecionado");

      // Delete existing and insert new
      await supabase
        .from("professional_availability")
        .delete()
        .eq("professional_id", selectedProfessional);

      const { error } = await supabase
        .from("professional_availability")
        .insert(
          schedule.map((day) => ({
            professional_id: selectedProfessional,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            is_available: day.is_available,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Disponibilidade salva!");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["professional-availability", selectedProfessional] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar disponibilidade");
    },
  });

  const updateDay = (dayIndex: number, field: keyof DayAvailability, value: any) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex ? { ...day, [field]: value } : day
      )
    );
    setHasChanges(true);
  };

  const selectedProfessionalData = professionals?.find((p) => p.id === selectedProfessional);

  return (
    <AdminPageScaffold
      title="Disponibilidade"
      subtitle="Configure horários e escalas dos profissionais"
      icon={CalendarClock}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Professional List */}
        <Card className="card-elevated lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingProfessionals ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : professionals && professionals.length > 0 ? (
              <div className="divide-y divide-border">
                {professionals.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => handleSelectProfessional(prof.id)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                      selectedProfessional === prof.id ? "bg-muted" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={prof.photo_url || undefined} />
                      <AvatarFallback>{prof.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{prof.name}</p>
                      <Badge variant={prof.is_active ? "default" : "secondary"} className="text-xs">
                        {prof.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhum profissional cadastrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Configuration */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedProfessionalData && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedProfessionalData.photo_url || undefined} />
                    <AvatarFallback>
                      {selectedProfessionalData.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <CardTitle className="text-base">
                  {selectedProfessionalData
                    ? `Agenda de ${selectedProfessionalData.name}`
                    : "Selecione um profissional"}
                </CardTitle>
              </div>
              {selectedProfessional && hasChanges && (
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProfessional ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um profissional para configurar sua disponibilidade
                </p>
              </div>
            ) : loadingAvailability ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = schedule.find((s) => s.day_of_week === day.value);
                  if (!daySchedule) return null;

                  return (
                    <div
                      key={day.value}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        daySchedule.is_available
                          ? "bg-card border-border"
                          : "bg-muted/30 border-transparent"
                      }`}
                    >
                      <div className="w-20">
                        <span className="font-medium text-sm">{day.label}</span>
                      </div>

                      <Switch
                        checked={daySchedule.is_available}
                        onCheckedChange={(checked) =>
                          updateDay(day.value, "is_available", checked)
                        }
                      />

                      {daySchedule.is_available && (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground sr-only">
                              Início
                            </Label>
                            <Input
                              type="time"
                              value={daySchedule.start_time}
                              onChange={(e) =>
                                updateDay(day.value, "start_time", e.target.value)
                              }
                              className="w-28 h-9 text-sm"
                            />
                          </div>
                          <span className="text-muted-foreground text-sm">às</span>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground sr-only">
                              Fim
                            </Label>
                            <Input
                              type="time"
                              value={daySchedule.end_time}
                              onChange={(e) =>
                                updateDay(day.value, "end_time", e.target.value)
                              }
                              className="w-28 h-9 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {!daySchedule.is_available && (
                        <span className="text-sm text-muted-foreground">Folga</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageScaffold>
  );
}

export default AvailabilityPage;
