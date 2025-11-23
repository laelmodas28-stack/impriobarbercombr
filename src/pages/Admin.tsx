import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Scissors, Settings, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [barbershopName, setBarbershopName] = useState("");

  // Get barbershop data
  const { barbershop } = useBarbershop();

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

  // Set barbershop name when data loads
  if (barbershop && !barbershopName) {
    setBarbershopName(barbershop.name);
  }

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
    enabled: profile?.role === "admin" && !!barbershop,
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
    enabled: profile?.role === "admin" && !!barbershop,
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
    enabled: profile?.role === "admin" && !!barbershop,
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

  const handleProfessionalPhotoUpload = async (professionalId: string, file: File) => {
    try {
      // Validação do tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Formato não suportado. Use apenas JPG, JPEG ou PNG. Formato detectado: ${file.type}`);
        return;
      }

      // Validação do tamanho (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`Arquivo muito grande. Tamanho máximo: 5MB. Tamanho do arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      toast.info("Enviando foto...");

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${professionalId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-photos')
        .upload(filePath, file, { 
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
    
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbershop-branding')
        .upload(filePath, file, { upsert: true });

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
    } finally {
      setUploadingLogo(false);
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Formato não suportado. Use apenas JPG, JPEG ou PNG.`);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Arquivo muito grande. Tamanho máximo: 5MB.`);
        return;
      }

      toast.info("Enviando imagem...");

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file, { 
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
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden">
                              {professional.photo_url ? (
                                <img 
                                  src={professional.photo_url} 
                                  alt={professional.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-10 h-10 text-primary-foreground" />
                              )}
                            </div>
                            <Input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                              className="hidden"
                              id={`photo-${professional.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log("Arquivo selecionado:", file.name, "Tipo:", file.type, "Tamanho:", file.size);
                                  handleProfessionalPhotoUpload(professional.id, file);
                                }
                                // Limpar o input para permitir selecionar o mesmo arquivo novamente
                                e.target.value = '';
                              }}
                            />
                            <Label 
                              htmlFor={`photo-${professional.id}`}
                              className="cursor-pointer mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Alterar foto
                            </Label>
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
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg bg-gradient-primary flex items-center justify-center overflow-hidden">
                              {service.image_url ? (
                                <img 
                                  src={service.image_url} 
                                  alt={service.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Scissors className="w-10 h-10 text-primary-foreground" />
                              )}
                            </div>
                            <Input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                              className="hidden"
                              id={`image-${service.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleServiceImageUpload(service.id, file);
                                }
                                e.target.value = '';
                              }}
                            />
                            <Label 
                              htmlFor={`image-${service.id}`}
                              className="cursor-pointer mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Alterar imagem
                            </Label>
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
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Logo da Barbearia</CardTitle>
                <CardDescription>
                  Personalize a logo que aparece no cabeçalho do app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {barbershop?.logo_url && (
                  <div className="flex justify-center">
                    <img 
                      src={barbershop.logo_url} 
                      alt="Logo atual"
                      className="w-32 h-32 object-contain rounded-lg border border-border"
                    />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    ref={logoInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                  <Button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    variant="imperial"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? "Enviando..." : "Fazer Upload da Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: JPG, JPEG, PNG (máx. 5MB)
                  </p>
                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
