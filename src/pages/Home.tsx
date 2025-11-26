import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Crown, Scissors, Star, Users, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SocialLinks } from "@/components/SocialLinks";
import { BusinessHours } from "@/components/BusinessHours";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .limit(4);
      
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
        .eq("is_active", true)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: barbershop } = useQuery({
    queryKey: ["barbershop-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="container mx-auto text-center relative z-10">
          <Crown className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Bem-vindo ao <span className="text-primary">Império</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Barbearia premium com atendimento de excelência. Agende seu horário com os melhores profissionais.
          </p>
          <Link to="/booking">
            <Button variant="premium" size="xl" className="shadow-elevation">
              <Calendar className="mr-2" />
              Agendar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/booking">
              <Card className="hover:shadow-gold transition-all cursor-pointer h-full border-border">
                <CardHeader>
                  <Calendar className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>Agendar Corte</CardTitle>
                  <CardDescription>Reserve seu horário</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/professionals">
              <Card className="hover:shadow-gold transition-all cursor-pointer h-full border-border">
                <CardHeader>
                  <Users className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>Profissionais</CardTitle>
                  <CardDescription>Conheça nossa equipe</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/services">
              <Card className="hover:shadow-gold transition-all cursor-pointer h-full border-border">
                <CardHeader>
                  <Scissors className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>Serviços</CardTitle>
                  <CardDescription>Veja o que oferecemos</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Serviços em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services?.map((service) => (
              <Card key={service.id} className="border-border hover:shadow-gold transition-all">
                <CardHeader>
                  <Scissors className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      R$ {service.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {service.duration_minutes} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Professionals */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Profissionais Recomendados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {professionals?.map((professional) => (
              <Card key={professional.id} className="border-border hover:shadow-gold transition-all">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                    {professional.photo_url ? (
                      <img 
                        src={professional.photo_url} 
                        alt={professional.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-primary-foreground" />
                    )}
                  </div>
                  <CardTitle>{professional.name}</CardTitle>
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{professional.rating}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground mb-4">
                    {professional.bio || "Profissional especializado"}
                  </p>
                  <Link to={`/professionals/${professional.id}`}>
                    <Button variant="imperial" className="w-full">
                      Ver Perfil
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria Preview */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nossos Trabalhos</h2>
            <p className="text-muted-foreground">
              Veja alguns dos resultados que entregamos aos nossos clientes
            </p>
          </div>
          <div className="text-center">
            <Link to="/gallery">
              <Button variant="premium" size="lg">
                Ver Galeria Completa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contato e Horários */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Fale Conosco</CardTitle>
                <CardDescription>Entre em contato através das nossas redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <SocialLinks 
                  whatsapp={barbershop?.whatsapp}
                  instagram={barbershop?.instagram}
                  tiktok={barbershop?.tiktok}
                  className="flex-col"
                />
              </CardContent>
            </Card>
            
            <BusinessHours />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
