import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { format, startOfDay, isToday, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  Plus, 
  UserPlus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  X,
  ChevronsUpDown,
  Check,
  Search
} from "lucide-react";
import { z } from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  validateAppointment, 
  checkConflicts, 
  isTimeInPast,
  type AppointmentFormData,
  type ConflictResult,
  type ExistingBooking,
} from "@/lib/appointments";
import { sendBookingConfirmationViaWebhook } from "@/lib/notifications/n8nWebhook";
import { sendBookingConfirmationWhatsApp } from "@/lib/notifications/evolutionApi";
const clientSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  phone: z.string().trim().max(20, "Telefone muito longo").optional(),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").optional().or(z.literal("")),
});

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: string;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  user_id: string;
  profile?: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
}: NewAppointmentModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("booking");
  
  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"pending" | "confirmed">("pending");
  const [sendNotification, setSendNotification] = useState(true);
  const [priceOverride, setPriceOverride] = useState<string>("");
  
  // New client form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setSelectedClient("");
    setSelectedService("");
    setSelectedProfessional("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    setStatus("pending");
    setSendNotification(true);
    setPriceOverride("");
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setConflictResult(null);
    setFormErrors({});
    setActiveTab("booking");
    setClientSearchOpen(false);
  }, []);

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["appointment-services", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId && open,
  });

  // Fetch professionals
  const { data: professionals } = useQuery({
    queryKey: ["appointment-professionals", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId && open,
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["appointment-clients", barbershopId],
    queryFn: async () => {
      // Get clients first
      const { data: clientsData, error: clientsError } = await supabase
        .from("barbershop_clients")
        .select("id, user_id, created_at, notes")
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      
      if (clientsError) throw clientsError;
      
      // Get profiles for each client
      const clientsWithProfiles = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, name, phone, email")
            .eq("user_id", client.user_id)
            .single();
          
          return {
            ...client,
            profile: profileData,
          };
        })
      );
      
      return clientsWithProfiles as Client[];
    },
    enabled: !!barbershopId && open,
  });

  // Fetch barbershop for opening hours
  const { data: barbershop } = useQuery({
    queryKey: ["appointment-barbershop", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .eq("id", barbershopId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId && open,
  });

  // Fetch existing bookings for conflict checking
  const { data: existingBookings } = useQuery({
    queryKey: ["appointment-bookings", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      
      // First fetch bookings with service info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_time,
          booking_date,
          status,
          client_id,
          service:services (
            duration_minutes,
            name
          )
        `)
        .eq("professional_id", selectedProfessional)
        .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);
      
      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) return [];
      
      // Fetch client names separately using user_id
      const clientIds = [...new Set(bookingsData.map(b => b.client_id).filter(Boolean))];
      
      let clientProfiles: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", clientIds);
        
        if (profilesData) {
          clientProfiles = profilesData.reduce((acc, p) => {
            acc[p.user_id] = p.name || "Cliente";
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Map bookings with client names
      return bookingsData.map(booking => ({
        id: booking.id,
        booking_time: booking.booking_time,
        booking_date: booking.booking_date,
        status: booking.status,
        service: booking.service,
        client: booking.client_id ? { name: clientProfiles[booking.client_id] || "Cliente" } : null,
      })) as ExistingBooking[];
    },
    enabled: !!selectedProfessional && !!selectedDate && open,
  });

  // Fetch time blocks for the professional
  const { data: timeBlocks } = useQuery({
    queryKey: ["professional-time-blocks", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("professional_time_blocks")
        .select("*")
        .eq("professional_id", selectedProfessional)
        .or(`and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek}),and(is_recurring.eq.false,block_date.eq.${dateStr})`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProfessional && !!selectedDate && open,
  });

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const businessHours = barbershop?.business_hours as Record<string, unknown> | null;
    const openTime = (businessHours?.opening_time as string) || "08:00";
    const closeTime = (businessHours?.closing_time as string) || "19:00";
    
    const [openHour] = openTime.split(":").map(Number);
    const [closeHour] = closeTime.split(":").map(Number);
    
    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }
    
    return slots;
  }, [barbershop]);

  // Helper function to convert time to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Get selected service data (moved before availableTimeSlots to avoid reference error)
  const selectedServiceData = useMemo(() => {
    return services?.find((s) => s.id === selectedService);
  }, [services, selectedService]);

  // Filter available time slots considering bookings, time blocks, and service duration
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return timeSlots;
    
    let available = [...timeSlots];
    const serviceDuration = selectedServiceData?.duration_minutes || 30;
    
    // Filter past times if today
    if (isToday(selectedDate)) {
      const now = new Date();
      const currentHour = getHours(now);
      const currentMinute = getMinutes(now);
      
      available = available.filter((slot) => {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        if (slotHour > currentHour) return true;
        if (slotHour === currentHour && slotMinute > currentMinute) return true;
        return false;
      });
    }
    
    // Filter slots that conflict with existing bookings (considering duration)
    if (existingBookings?.length) {
      available = available.filter((slot) => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + serviceDuration;
        
        // Check if this slot would conflict with any existing booking
        for (const booking of existingBookings) {
          const bookingStart = timeToMinutes(booking.booking_time.substring(0, 5));
          const bookingDuration = booking.service?.duration_minutes || 30;
          const bookingEnd = bookingStart + bookingDuration;
          
          // Conflict exists if: slotStart < bookingEnd AND slotEnd > bookingStart
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Filter slots that conflict with time blocks (lunch, breaks, etc.)
    if (timeBlocks?.length) {
      available = available.filter((slot) => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + serviceDuration;
        
        for (const block of timeBlocks) {
          const blockStart = timeToMinutes(block.start_time.substring(0, 5));
          const blockEnd = timeToMinutes(block.end_time.substring(0, 5));
          
          // Conflict exists if slot overlaps with block
          if (slotStart < blockEnd && slotEnd > blockStart) {
            return false;
          }
        }
        return true;
      });
    }
    
    return available;
  }, [selectedDate, timeSlots, existingBookings, timeBlocks, selectedServiceData]);

  // Calculate final price
  const finalPrice = useMemo(() => {
    if (priceOverride !== "") {
      const parsed = parseFloat(priceOverride);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedServiceData?.price || 0;
  }, [priceOverride, selectedServiceData]);

  // Reset time when professional or date changes
  useEffect(() => {
    setSelectedTime("");
    setConflictResult(null);
  }, [selectedProfessional, selectedDate]);

  // Check for conflicts when time is selected
  useEffect(() => {
    if (selectedProfessional && selectedDate && selectedTime && selectedServiceData && existingBookings) {
      const result = checkConflicts(
        selectedProfessional,
        selectedDate,
        selectedTime,
        selectedServiceData.duration_minutes,
        existingBookings
      );
      setConflictResult(result);
    } else {
      setConflictResult(null);
    }
  }, [selectedProfessional, selectedDate, selectedTime, selectedServiceData, existingBookings]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedClient) errors.client = "Cliente é obrigatório";
    if (!selectedService) errors.service = "Serviço é obrigatório";
    if (!selectedProfessional) errors.professional = "Profissional é obrigatório";
    if (!selectedDate) errors.date = "Data é obrigatória";
    if (!selectedTime) errors.time = "Horário é obrigatório";
    
    if (selectedDate && selectedTime && isTimeInPast(selectedDate, selectedTime)) {
      errors.time = "Horário não pode ser no passado";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedClient, selectedService, selectedProfessional, selectedDate, selectedTime]);

  // Handle booking creation
  const handleCreateBooking = async () => {
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (conflictResult?.hasConflict) {
      toast.error("Há um conflito de horário. Escolha outro horário.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        client_id: selectedClient,
        service_id: selectedService,
        professional_id: selectedProfessional,
        barbershop_id: barbershopId,
        booking_date: format(selectedDate!, "yyyy-MM-dd"),
        booking_time: selectedTime,
        price: finalPrice,
        notes: notes.trim() || null,
        status,
      });

      if (error) throw error;

      // Send notifications if enabled
      if (sendNotification) {
        // Get client profile info
        const selectedClientData = clients?.find(c => c.user_id === selectedClient);
        const selectedProfessionalData = professionals?.find(p => p.id === selectedProfessional);
        
        const notificationParams = {
          barbershopId,
          barbershopName: barbershop?.name || "",
          barbershopAddress: barbershop?.address || "",
          barbershopLogoUrl: barbershop?.logo_url || "",
          clientName: selectedClientData?.profile?.name || "Cliente",
          clientPhone: selectedClientData?.profile?.phone || "",
          serviceName: selectedServiceData?.name || "",
          servicePrice: finalPrice,
          professionalName: selectedProfessionalData?.name || "",
          bookingDate: format(selectedDate!, "yyyy-MM-dd"),
          bookingTime: selectedTime,
          notes: notes.trim() || undefined,
        };

        // Send via n8n webhook (email)
        try {
          await sendBookingConfirmationViaWebhook({
            ...notificationParams,
            clientEmail: selectedClientData?.profile?.email || null,
          });
        } catch (notifError) {
          console.warn("Failed to send n8n notification:", notifError);
        }

        // Send via WhatsApp (Evolution API)
        try {
          await sendBookingConfirmationWhatsApp(notificationParams);
        } catch (whatsappError) {
          console.warn("Failed to send WhatsApp notification:", whatsappError);
        }
      }

      toast.success("Agendamento criado com sucesso!");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-bookings"] });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar agendamento";
      console.error("Erro ao criar agendamento:", error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle client creation
  const handleCreateClient = async () => {
    // Validate with zod
    const result = clientSchema.safeParse({
      name: newClientName,
      phone: newClientPhone || undefined,
      email: newClientEmail || undefined,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsCreatingClient(true);
    try {
      let clientId: string | null = null;

      // Check for existing profile by phone
      if (newClientPhone) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", newClientPhone)
          .maybeSingle();
        
        if (existingProfile) {
          clientId = existingProfile.id;
        }
      }

      // Create new profile if needed using RPC function (bypasses RLS)
      if (!clientId) {
        const { data: newUserId, error: profileError } = await supabase
          .rpc("create_client_profile", {
            p_name: newClientName.trim(),
            p_email: newClientEmail?.trim() || null,
            p_phone: newClientPhone?.trim() || null,
          });

        if (profileError) throw profileError;
        clientId = newUserId;
      }

      // Add to barbershop clients
      const { error: clientError } = await supabase
        .from("barbershop_clients")
        .upsert(
          {
            barbershop_id: barbershopId,
            user_id: clientId,
            notes: newClientEmail ? `Email: ${newClientEmail}` : null,
          },
          { onConflict: "barbershop_id,user_id" }
        );

      if (clientError) throw clientError;

      toast.success("Cliente cadastrado com sucesso!");
      
      // Reset client form
      setNewClientName("");
      setNewClientPhone("");
      setNewClientEmail("");
      
      // Select new client and switch tab
      setSelectedClient(clientId);
      setActiveTab("booking");
      
      queryClient.invalidateQueries({ queryKey: ["appointment-clients"] });
      queryClient.invalidateQueries({ queryKey: ["barbershop-clients"] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar cliente";
      console.error("Erro ao cadastrar cliente:", error);
      toast.error(errorMessage);
    } finally {
      setIsCreatingClient(false);
    }
  };

  // Select suggested slot
  const handleSelectSuggestedSlot = (slot: string) => {
    setSelectedTime(slot);
  };

  const isFormValid = selectedClient && selectedService && selectedProfessional && selectedDate && selectedTime && !conflictResult?.hasConflict;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Agendamento
          </SheetTitle>
          <SheetDescription>
            Agende um horário ou cadastre um novo cliente
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="booking" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Agendar
              </TabsTrigger>
              <TabsTrigger value="client" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Cliente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="space-y-4 mt-4">
              {/* Client with Search */}
              <div className="space-y-2">
                <Label>
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !selectedClient && "text-muted-foreground",
                        formErrors.client && "border-destructive"
                      )}
                    >
                      {selectedClient
                        ? (() => {
                            const client = clients?.find((c) => c.user_id === selectedClient);
                            return client?.profile?.name || "Cliente selecionado";
                          })()
                        : "Buscar cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nome ou telefone..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-4 text-center text-sm">
                            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setClientSearchOpen(false);
                                setActiveTab("client");
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Cadastrar novo cliente
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {clients?.map((c) => (
                            <CommandItem
                              key={c.user_id}
                              value={`${c.profile?.name || ""} ${c.profile?.phone || ""}`}
                              onSelect={() => {
                                setSelectedClient(c.user_id);
                                setClientSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClient === c.user_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{c.profile?.name || "Cliente sem nome"}</span>
                                {c.profile?.phone && (
                                  <span className="text-xs text-muted-foreground">
                                    {c.profile.phone}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.client && (
                  <p className="text-sm text-destructive">{formErrors.client}</p>
                )}
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label htmlFor="service">
                  Serviço <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service" className={cn(formErrors.service && "border-destructive")}>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{service.name}</span>
                          <span className="text-muted-foreground text-xs">
                            R$ {service.price.toFixed(2)} ({service.duration_minutes}min)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.service && (
                  <p className="text-sm text-destructive">{formErrors.service}</p>
                )}
              </div>

              {/* Professional */}
              <div className="space-y-2">
                <Label htmlFor="professional">
                  Profissional <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger id="professional" className={cn(formErrors.professional && "border-destructive")}>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals?.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.professional && (
                  <p className="text-sm text-destructive">{formErrors.professional}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Data <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                          formErrors.date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate 
                          ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) 
                          : "Selecionar"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < startOfDay(new Date())}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  {formErrors.date && (
                    <p className="text-sm text-destructive">{formErrors.date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Horário <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={selectedTime} 
                    onValueChange={setSelectedTime}
                    disabled={!selectedDate || !selectedProfessional}
                  >
                    <SelectTrigger className={cn(formErrors.time && "border-destructive")}>
                      <SelectValue 
                        placeholder={
                          !selectedDate 
                            ? "Data primeiro" 
                            : !selectedProfessional 
                            ? "Profissional" 
                            : "Horário"
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {time}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Sem horários disponíveis
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.time && (
                    <p className="text-sm text-destructive">{formErrors.time}</p>
                  )}
                </div>
              </div>

              {/* Conflict Alert */}
              {conflictResult?.hasConflict && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Conflito de Horário</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      Já existe um agendamento das {conflictResult.conflictingAppointment?.startTime} às {conflictResult.conflictingAppointment?.endTime}
                      {conflictResult.conflictingAppointment?.clientName && (
                        <> com {conflictResult.conflictingAppointment.clientName}</>
                      )}
                    </p>
                    {conflictResult.suggestedSlots && conflictResult.suggestedSlots.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs">Sugestões:</span>
                        {conflictResult.suggestedSlots.map((slot) => (
                          <Badge
                            key={slot}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleSelectSuggestedSlot(slot)}
                          >
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Status and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "pending" | "confirmed")}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={selectedServiceData?.price.toFixed(2) || "0.00"}
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Alguma observação..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Notification toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label htmlFor="notification" className="text-sm cursor-pointer">
                  Enviar confirmação ao cliente
                </Label>
                <Switch
                  id="notification"
                  checked={sendNotification}
                  onCheckedChange={setSendNotification}
                />
              </div>

              {/* Summary */}
              {selectedServiceData && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Resumo</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedServiceData.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedServiceData.duration_minutes} minutos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        R$ {finalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <Button
                onClick={handleCreateBooking}
                disabled={isSubmitting || !isFormValid}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Criar Agendamento
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="client" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="Nome do cliente"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  placeholder="(00) 00000-0000"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-mail</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  maxLength={255}
                />
              </div>

              <Button
                onClick={handleCreateClient}
                disabled={isCreatingClient || !newClientName.trim()}
                className="w-full"
                size="lg"
              >
                {isCreatingClient ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Cliente
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default NewAppointmentModal;
