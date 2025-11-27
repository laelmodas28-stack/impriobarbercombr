import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Scissors, Settings, Image as ImageIcon, User, Trash2, Upload, BarChart3, Plus, Crown, Bell, Send } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";
import { useUserRole } from "@/hooks/useUserRole";
import { useBarbershopClients } from "@/hooks/useBarbershopClients";
import ImageUpload from "@/components/ImageUpload";
import { resizeImage } from "@/lib/imageUtils";
import DashboardMetrics from "@/components/admin/DashboardMetrics";
import ThemeSelector from "@/components/admin/ThemeSelector";
import ProfessionalForm from "@/components/admin/ProfessionalForm";
import ServiceForm from "@/components/admin/ServiceForm";
import { SubscriptionPlanForm } from "@/components/admin/SubscriptionPlanForm";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { BarberInviteForm } from "@/components/admin/BarberInviteForm";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [barbershopName, setBarbershopName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("19:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
  ]);
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [sendToClient, setSendToClient] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  
  // SMS settings
  const [sendSms, setSendSms] = useState(false);
  const [smsProvider, setSmsProvider] = useState("vonage");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsFromNumber, setSmsFromNumber] = useState("");
  
  // Push settings
  const [pushEnabled, setPushEnabled] = useState(false);
  
  // Reminder settings
  const [reminderMinutes, setReminderMinutes] = useState(30);

  const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  // Get barbershop data
  const { barbershop } = useBarbershop();
  
  // Check if user is admin
  const { isAdmin, isBarbershopOwner, isLoading: roleLoading } = useUserRole(barbershop?.id);
  
  // Get barbershop clients
  const { clients, getInactiveClients } = useBarbershopClients(barbershop?.id);

  // Get subscription data
  const { plans, refetchPlans, allSubscriptions } = useSubscriptions(barbershop?.id);

  // Set barbershop data when it loads
  useEffect(() => {
    if (barbershop) {
      setBarbershopName(barbershop.name || "");
      setInstagram(barbershop.instagram || "");
      setWhatsapp(barbershop.whatsapp || "");
      setTiktok(barbershop.tiktok || "");
      setOpeningTime(barbershop.opening_time?.substring(0, 5) || "09:00");
      setClosingTime(barbershop.closing_time?.substring(0, 5) || "19:00");
      if (barbershop.opening_days && barbershop.opening_days.length > 0) {
        setSelectedDays(barbershop.opening_days);
      }
    }
  }, [barbershop]);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  const { data: bookings, refetch: refetchBookings } = useQuery({
    queryKey: ["admin-bookings", barbershop?.id],
    queryFn: async () => {
      if (!barbershop) return [];
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, phone),
          service:services(name),
          professional:professionals(name)
        `)
        .eq("barbershop_id", barbershop.id)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!barbershop,
  });

  const { data: professionals } = useQuery({
    queryKey: ["admin-professionals", barbershop?.id],
    queryFn: async () => {
      if (!barbershop) return [];
      
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!barbershop,
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services", barbershop?.id],
    queryFn: async () => {
      if (!barbershop) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!barbershop,
  });

  const { data: gallery, refetch: refetchGallery } = useQuery({
    queryKey: ["admin-gallery", barbershop?.id],
    queryFn: async () => {
      if (!barbershop) return [];
      
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!barbershop,
  });

  // Fetch notification settings
  const { data: notificationSettings, refetch: refetchNotifications } = useQuery({
    queryKey: ["notification-settings", barbershop?.id],
    queryFn: async () => {
      if (!barbershop) return null;
      
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!barbershop,
  });

  // Load notification settings
  useEffect(() => {
    if (notificationSettings) {
      setNotificationsEnabled(notificationSettings.enabled ?? true);
      setCustomMessage(notificationSettings.custom_message || "");
      setAdminEmail(notificationSettings.admin_email || "");
      setAdminWhatsapp(notificationSettings.admin_whatsapp || "");
      setSendToClient(notificationSettings.send_to_client ?? true);
      setSendWhatsapp(notificationSettings.send_whatsapp ?? false);
      setSendSms(notificationSettings.send_sms ?? false);
      setSmsProvider(notificationSettings.sms_provider || "vonage");
      setSmsApiKey(notificationSettings.sms_api_key || "");
      setSmsFromNumber(notificationSettings.sms_from_number || "");
      setPushEnabled(notificationSettings.push_enabled ?? false);
      setReminderMinutes(notificationSettings.reminder_minutes || 30);
    }
  }, [notificationSettings]);

  // Don't render if not loaded yet or not admin
  if (!user || roleLoading || !isAdmin) {
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

  const handleProfessionalPhotoUpload = async (professionalId: string, file: File) => {
    try {
      toast.info("Enviando foto...");

      // Redimensionar imagem
      const resizedFile = await resizeImage(file, 800, 800);

      const fileExt = resizedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${professionalId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-photos')
        .upload(filePath, resizedFile, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        toast.error(`Erro no upload: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('professional-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('professionals')
        .update({ photo_url: publicUrl })
        .eq('id', professionalId);

      if (updateError) {
        console.error("Erro ao atualizar banco:", updateError);
        toast.error(`Erro ao atualizar: ${updateError.message}`);
        return;
      }

      toast.success("Foto atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
    } catch (error: any) {
      console.error("Erro geral:", error);
      toast.error(`Erro: ${error?.message || "Erro desconhecido ao fazer upload"}`);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!barbershop) return;
    
    try {
      toast.info("Enviando logo...");

      // Redimensionar logo
      const resizedFile = await resizeImage(file, 512, 512);

      const fileExt = resizedFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbershop-branding')
        .upload(filePath, resizedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('barbershop-branding')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('barbershops')
        .update({ logo_url: publicUrl })
        .eq('id', barbershop.id);

      if (updateError) throw updateError;

      toast.success("Logo atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["barbershop"] });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload da logo");
    }
  };

  const handleNameUpdate = async () => {
    if (!barbershop) return;
    
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ name: barbershopName })
        .eq('id', barbershop.id);

      if (error) throw error;

      toast.success("Nome atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["barbershop"] });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar nome");
    }
  };

  const handleServiceImageUpload = async (serviceId: string, file: File) => {
    try {
      toast.info("Enviando imagem...");

      // Redimensionar imagem
      const resizedFile = await resizeImage(file, 800, 800);

      const fileExt = resizedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, resizedFile, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        toast.error(`Erro no upload: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('services')
        .update({ image_url: publicUrl })
        .eq('id', serviceId);

      if (updateError) {
        console.error("Erro ao atualizar banco:", updateError);
        toast.error(`Erro ao atualizar: ${updateError.message}`);
        return;
      }

      toast.success("Imagem atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    } catch (error: any) {
      console.error("Erro geral:", error);
      toast.error(`Erro: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const handleGalleryImageUpload = async (file: File) => {
    if (!barbershop) return;
    
    try {
      toast.info("Enviando foto para galeria...");

      // Redimensionar imagem
      const resizedFile = await resizeImage(file, 1200, 1200);

      const fileExt = resizedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, resizedFile, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        toast.error(`Erro no upload: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const nextOrder = (gallery?.length || 0);

      const { error: insertError } = await supabase
        .from('gallery')
        .insert({
          barbershop_id: barbershop.id,
          image_url: publicUrl,
          display_order: nextOrder
        });

      if (insertError) {
        console.error("Erro ao inserir:", insertError);
        toast.error(`Erro ao adicionar à galeria: ${insertError.message}`);
        return;
      }

      toast.success("Foto adicionada à galeria!");
      refetchGallery();
    } catch (error: any) {
      console.error("Erro geral:", error);
      toast.error(`Erro: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const handleDeleteGalleryImage = async (galleryId: string, imageUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = imageUrl.split('/gallery/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Deletar do storage
        await supabase.storage
          .from('gallery')
          .remove([filePath]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', galleryId);

      if (error) throw error;

      toast.success("Foto removida da galeria");
      refetchGallery();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao remover foto");
    }
  };

  const handleThemeChange = async (themeColor: string) => {
    if (!barbershop) return;
    
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ primary_color: themeColor })
        .eq('id', barbershop.id);

      if (error) throw error;

      toast.success("Tema atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["barbershop"] });
      
      // Recarregar página para aplicar novo tema
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar tema:", error);
      toast.error("Erro ao atualizar tema");
    }
  };

  const handleBusinessInfoUpdate = async () => {
    if (!barbershop) return;
    
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({
          instagram,
          whatsapp,
          tiktok,
          opening_time: openingTime + ":00",
          closing_time: closingTime + ":00",
          opening_days: selectedDays
        })
        .eq('id', barbershop.id);

      if (error) throw error;

      toast.success("Informações atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["barbershop"] });
    } catch (error) {
      console.error("Erro ao atualizar informações:", error);
      toast.error("Erro ao atualizar informações");
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    if (!barbershop) return;
    
    try {
      const settingsData = {
        barbershop_id: barbershop.id,
        enabled: notificationsEnabled,
        custom_message: customMessage,
        admin_email: adminEmail,
        admin_whatsapp: adminWhatsapp,
        send_to_client: sendToClient,
        send_whatsapp: sendWhatsapp,
        send_sms: sendSms,
        sms_provider: smsProvider,
        sms_api_key: smsApiKey,
        sms_from_number: smsFromNumber,
        push_enabled: pushEnabled,
        reminder_minutes: reminderMinutes,
      };

      if (notificationSettings) {
        // Update existing
        const { error } = await supabase
          .from('notification_settings')
          .update(settingsData)
          .eq('id', notificationSettings.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('notification_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast.success("Configurações de notificação salvas!");
      refetchNotifications();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
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

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:grid-cols-9">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="clients">
              <User className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="professionals">
              <Users className="w-4 h-4 mr-2" />
              Profissionais
            </TabsTrigger>
            <TabsTrigger value="services">
              <Scissors className="w-4 h-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <ImageIcon className="w-4 h-4 mr-2" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <Crown className="w-4 h-4 mr-2" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="notifications">
              🔔 Notificações
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Visão geral do desempenho da barbearia</p>
            </div>
            
            {bookings && <DashboardMetrics bookings={bookings} />}
          </TabsContent>

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

          {/* Clientes */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Gestão de Clientes</CardTitle>
                <CardDescription>
                  Total: {clients?.length || 0} clientes | Inativos (30+ dias): {getInactiveClients(30).length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <Card key={client.id} className="border-border bg-card/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div>
                                  <p className="font-semibold text-lg">{client.client?.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{client.phone || client.client?.phone}</p>
                                </div>
                                {!client.is_active && (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                <p><span className="text-muted-foreground">Primeira visita:</span> {client.first_visit ? format(new Date(client.first_visit), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</p>
                                <p><span className="text-muted-foreground">Última visita:</span> {client.last_visit ? format(new Date(client.last_visit), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</p>
                                <p><span className="text-muted-foreground">Total de visitas:</span> {client.total_visits}</p>
                              </div>
                              {client.notes && (
                                <p className="text-sm mt-2 text-muted-foreground italic">{client.notes}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum cliente registrado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profissionais */}
          <TabsContent value="professionals" className="space-y-6">
            {/* Formulário de Convite para Barbeiros */}
            {barbershop && (
              <BarberInviteForm 
                barbershopId={barbershop.id} 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-professionals"] })} 
              />
            )}
            
            {/* Formulário de Cadastro */}
            <ProfessionalForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-professionals"] })} />

            {/* Lista de Profissionais */}
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
                         <div className="flex gap-4 items-start">
                           <div className="w-32">
                             <ImageUpload
                               label=""
                               currentImageUrl={professional.photo_url}
                               onImageSelect={(file) => handleProfessionalPhotoUpload(professional.id, file)}
                               maxSizeMB={5}
                               maxWidth={800}
                               maxHeight={800}
                               aspectRatio="square"
                               className="w-full"
                             />
                           </div>
                           <div className="flex-1">
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
          <TabsContent value="services" className="space-y-6">
            {/* Formulário de Cadastro */}
            <ServiceForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-services"] })} />

            {/* Lista de Serviços */}
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
                         <div className="flex gap-4 items-start">
                           <div className="w-32">
                             <ImageUpload
                               label=""
                               currentImageUrl={service.image_url}
                               onImageSelect={(file) => handleServiceImageUpload(service.id, file)}
                               maxSizeMB={5}
                               maxWidth={800}
                               maxHeight={800}
                               aspectRatio="square"
                               className="w-full"
                             />
                           </div>
                           <div className="flex-1">
                             <div className="flex justify-between items-start">
                               <div>
                                 <p className="font-semibold text-lg">{service.name}</p>
                                 <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                                 <p className="text-sm">
                                   <span className="text-primary font-bold">R$ {service.price}</span>
                                   <span className="text-muted-foreground ml-2">• {service.duration_minutes} min</span>
                                 </p>
                               </div>
                               <Badge variant={service.is_active ? "default" : "secondary"}>
                                 {service.is_active ? "Ativo" : "Inativo"}
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

          {/* Configurações */}
          <TabsContent value="settings" className="space-y-6">
            {/* Tema */}
            <ThemeSelector 
              currentTheme={barbershop?.primary_color || "#D4AF37"}
              onThemeChange={handleThemeChange}
            />

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Logo da Barbearia</CardTitle>
                <CardDescription>
                  Personalize a logo que aparece no cabeçalho do app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  label=""
                  currentImageUrl={barbershop?.logo_url}
                  onImageSelect={handleLogoUpload}
                  maxSizeMB={5}
                  maxWidth={512}
                  maxHeight={512}
                  aspectRatio="square"
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Nome da Barbearia</CardTitle>
                <CardDescription>
                  Altere o nome que aparece no app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barbershop-name">Nome</Label>
                  <Input
                    id="barbershop-name"
                    value={barbershopName}
                    onChange={(e) => setBarbershopName(e.target.value)}
                    placeholder="Nome da Barbearia"
                  />
                </div>
                <Button onClick={handleNameUpdate} variant="imperial">
                  Salvar Nome
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>
                  Configure redes sociais e horários de funcionamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (com código do país)</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+5511999999999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: +5511999999999 (incluir + e código do país)
                  </p>
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@suabarbearia"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok (opcional)</Label>
                  <Input
                    id="tiktok"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@suabarbearia"
                  />
                </div>

                {/* Horários */}
                <div className="space-y-4">
                  <Label>Horário de Funcionamento</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="opening-time">Abertura</Label>
                      <Input
                        id="opening-time"
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closing-time">Fechamento</Label>
                      <Input
                        id="closing-time"
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Dias de Funcionamento */}
                <div className="space-y-3">
                  <Label>Dias de Funcionamento</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {weekDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={selectedDays.includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                        />
                        <label
                          htmlFor={day}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleBusinessInfoUpdate} variant="imperial">
                  Salvar Informações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Galeria */}
          <TabsContent value="gallery" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Galeria / Portfólio</CardTitle>
                <CardDescription>
                  Adicione até 10 fotos dos seus trabalhos (estilo Instagram)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Nova Foto */}
                {(!gallery || gallery.length < 10) && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <ImageUpload
                      label="Adicionar Nova Foto"
                      onImageSelect={handleGalleryImageUpload}
                      maxSizeMB={5}
                      maxWidth={1200}
                      maxHeight={1200}
                      aspectRatio="square"
                    />
                  </div>
                )}

                {/* Grid de Fotos */}
                {gallery && gallery.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-border bg-card">
                          <img
                            src={item.image_url}
                            alt={item.title || "Foto da galeria"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteGalleryImage(item.id, item.image_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {(!gallery || gallery.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma foto na galeria ainda</p>
                    <p className="text-sm">Adicione fotos dos seus trabalhos para mostrar aos clientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assinaturas */}
          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionPlanForm onSuccess={refetchPlans} />

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Planos Cadastrados</CardTitle>
                <CardDescription>
                  Total: {plans?.length || 0} planos | Assinaturas Ativas: {allSubscriptions?.filter(s => s.status === 'active').length || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans && plans.length > 0 ? (
                    plans.map((plan) => (
                      <Card key={plan.id} className="border-border bg-card/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Crown className="w-5 h-5 text-primary" />
                                <p className="font-semibold text-lg">{plan.name}</p>
                                <Badge variant={plan.is_active ? "default" : "secondary"}>
                                  {plan.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <p><span className="text-muted-foreground">Preço:</span> R$ {plan.price}</p>
                                <p><span className="text-muted-foreground">Duração:</span> {plan.duration_days} dias</p>
                                <p><span className="text-muted-foreground">Serviços/mês:</span> {plan.max_services_per_month || "Ilimitado"}</p>
                                <p><span className="text-muted-foreground">Desconto:</span> {plan.discount_percentage || 0}%</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum plano cadastrado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Assinaturas dos Clientes</CardTitle>
                <CardDescription>
                  Gerencie todas as assinaturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allSubscriptions && allSubscriptions.length > 0 ? (
                    allSubscriptions.map((subscription) => (
                      <div 
                        key={subscription.id}
                        className="flex justify-between items-center p-4 bg-card/30 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{subscription.client?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.plan?.name} - {format(new Date(subscription.start_date), "dd/MM/yyyy")} até {format(new Date(subscription.end_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            subscription.status === 'active' ? 'default' :
                            subscription.status === 'expired' ? 'secondary' : 'destructive'
                          }>
                            {subscription.status === 'active' ? 'Ativo' :
                             subscription.status === 'expired' ? 'Expirado' : 'Cancelado'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ {subscription.plan?.price}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma assinatura ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Status de Assinaturas Expirando */}
            <Card className="border-border bg-amber-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Notificações de Assinatura
                </CardTitle>
                <CardDescription>
                  Enviar alertas para clientes com assinaturas próximas do vencimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                  <div>
                    <p className="font-semibold">Verificar Assinaturas Expirando</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações para clientes com assinaturas expirando nos próximos 7 dias
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        toast.info("Verificando assinaturas...");
                        const { data, error } = await supabase.functions.invoke("check-expiring-subscriptions");
                        
                        if (error) throw error;
                        
                        toast.success(
                          `${data.notifications?.length || 0} notificação(ões) enviada(s)!`,
                          { duration: 5000 }
                        );
                      } catch (error: any) {
                        console.error("Erro ao verificar assinaturas:", error);
                        toast.error("Erro ao verificar assinaturas");
                      }
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Verificar Agora
                  </Button>
                </div>
                
                {allSubscriptions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-green-500/50 bg-green-500/10">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                        <p className="text-2xl font-bold text-green-500">
                          {allSubscriptions.filter(s => s.status === 'active').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/50 bg-amber-500/10">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Expirando em 7 dias</p>
                        <p className="text-2xl font-bold text-amber-500">
                          {allSubscriptions.filter(s => {
                            const endDate = new Date(s.end_date);
                            const today = new Date();
                            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            return s.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                          }).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-500/50 bg-red-500/10">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Expiradas</p>
                        <p className="text-2xl font-bold text-red-500">
                          {allSubscriptions.filter(s => s.status === 'expired').length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Configurações de Notificações de Agendamento</CardTitle>
                <CardDescription>
                  Configure mensagens automáticas para clientes após agendamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle de Notificações */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications-enabled">Ativar Notificações</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar emails automaticamente aos clientes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="notifications-enabled"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                {/* Email do Admin */}
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Seu Email (para receber cópias)</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@barbearia.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Você receberá um email sempre que houver um novo agendamento
                  </p>
                </div>

                {/* WhatsApp do Admin */}
                <div className="space-y-2">
                  <Label htmlFor="admin-whatsapp">Seu WhatsApp (com código do país)</Label>
                  <Input
                    id="admin-whatsapp"
                    value={adminWhatsapp}
                    onChange={(e) => setAdminWhatsapp(e.target.value)}
                    placeholder="+5511999999999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: +5511999999999
                  </p>
                </div>

                {/* Tempo de Antecedência para Lembretes */}
                <div className="space-y-2">
                  <Label htmlFor="reminder-minutes">⏰ Enviar Lembrete com Antecedência</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="reminder-minutes"
                      type="number"
                      min="5"
                      max="1440"
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(parseInt(e.target.value) || 30)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutos antes do agendamento</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O cliente receberá um lembrete {reminderMinutes} minutos antes do horário agendado.
                    Recomendado: 30 minutos (padrão) ou 10 minutos para lembretes mais próximos.
                  </p>
                </div>

                {/* Mensagem Personalizada */}
                <div className="space-y-2">
                  <Label htmlFor="custom-message">Mensagem Personalizada</Label>
                  <textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Olá {nome}! Seu agendamento foi confirmado para {data} às {hora}..."
                    rows={5}
                    className="w-full p-3 border border-border rounded-md bg-background"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Variáveis disponíveis:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code>{"{nome}"}</code> - Nome do cliente</li>
                      <li><code>{"{data}"}</code> - Data do agendamento</li>
                      <li><code>{"{hora}"}</code> - Horário do agendamento</li>
                      <li><code>{"{servico}"}</code> - Nome do serviço</li>
                      <li><code>{"{profissional}"}</code> - Nome do profissional</li>
                    </ul>
                  </div>
                </div>

                {/* Opções de Envio */}
                <div className="space-y-3">
                  <Label>Opções de Envio</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-to-client"
                      checked={sendToClient}
                      onChange={(e) => setSendToClient(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="send-to-client" className="text-sm">
                      Enviar email para o cliente
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-sms"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="send-sms" className="text-sm">
                      Enviar SMS para o cliente
                    </label>
                  </div>
                  
                  {sendSms && (
                    <div className="ml-6 space-y-3 p-4 border border-border rounded-md bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="sms-provider">Provedor de SMS</Label>
                        <select
                          id="sms-provider"
                          value={smsProvider}
                          onChange={(e) => setSmsProvider(e.target.value)}
                          className="w-full p-2 border border-border rounded-md bg-background"
                        >
                          <option value="vonage">Vonage (Nexmo)</option>
                          <option value="messagebird">MessageBird</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sms-api-key">API Key</Label>
                        <Input
                          id="sms-api-key"
                          type="password"
                          value={smsApiKey}
                          onChange={(e) => setSmsApiKey(e.target.value)}
                          placeholder="Para Vonage use: api_key:api_secret"
                        />
                        <p className="text-xs text-muted-foreground">
                          {smsProvider === 'vonage' && 'Formato: api_key:api_secret (encontrado no dashboard do Vonage)'}
                          {smsProvider === 'messagebird' && 'Sua Access Key do MessageBird'}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sms-from-number">Número de Origem</Label>
                        <Input
                          id="sms-from-number"
                          value={smsFromNumber}
                          onChange={(e) => setSmsFromNumber(e.target.value)}
                          placeholder="Ex: Barbearia ou +5511999999999"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="push-enabled"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="push-enabled" className="text-sm">
                      Habilitar Push Notifications no navegador
                    </label>
                  </div>
                  
                  {pushEnabled && (
                    <div className="ml-6 p-4 border border-border rounded-md bg-blue-500/10">
                      <p className="text-sm text-muted-foreground">
                        ℹ️ Push Notifications funcionam apenas em navegadores modernos. 
                        Os clientes precisarão permitir notificações quando solicitado.
                      </p>
                    </div>
                  )}
                </div>

                <Button onClick={handleNotificationSettingsUpdate} variant="imperial">
                  Salvar Configurações
                </Button>

                {/* Preview */}
                {customMessage && (
                  <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
                    <h4 className="font-semibold mb-2">Preview da mensagem:</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {customMessage
                        .replace("{nome}", "João Silva")
                        .replace("{data}", "25/11/2024")
                        .replace("{hora}", "14:00")
                        .replace("{servico}", "Corte + Barba")
                        .replace("{profissional}", "Carlos")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
