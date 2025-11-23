import { useState } from "react";
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
import { Calendar, Users, Scissors, Settings, Image as ImageIcon, User, Trash2, Upload, BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";
import ImageUpload from "@/components/ImageUpload";
import { resizeImage } from "@/lib/imageUtils";
import DashboardMetrics from "@/components/admin/DashboardMetrics";
import ThemeSelector from "@/components/admin/ThemeSelector";
import ProfessionalForm from "@/components/admin/ProfessionalForm";
import ServiceForm from "@/components/admin/ServiceForm";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
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
            <TabsTrigger value="gallery">
              <ImageIcon className="w-4 h-4 mr-2" />
              Galeria
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

          {/* Profissionais */}
          <TabsContent value="professionals" className="space-y-6">
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
