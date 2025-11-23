import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, MapPin, Phone, Instagram } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const About = () => {
  const { data: info } = useQuery({
    queryKey: ["barbershop-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_info")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleWhatsApp = () => {
    if (info?.whatsapp) {
      window.open(`https://wa.me/${info.whatsapp}`, "_blank");
    }
  };

  const handleInstagram = () => {
    if (info?.instagram) {
      window.open(`https://instagram.com/${info.instagram}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Crown className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Sobre o IMPÉRIO BARBER</h1>
            <p className="text-muted-foreground text-lg">
              {info?.description || "Barbearia premium com atendimento de excelência"}
            </p>
          </div>

          {/* História */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle>Nossa História</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p className="mb-4">
                O IMPÉRIO BARBER nasceu com o objetivo de proporcionar uma experiência única e premium 
                para homens que valorizam qualidade e estilo. Combinamos técnicas tradicionais de barbearia 
                com as tendências mais modernas do mercado.
              </p>
              <p>
                Nossa equipe é formada por profissionais altamente qualificados e apaixonados pelo que fazem, 
                garantindo que cada cliente saia do nosso estabelecimento com a melhor versão de si mesmo.
              </p>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Contato e Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {info?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Endereço</p>
                    <p className="text-muted-foreground">{info.address}</p>
                  </div>
                </div>
              )}

              {info?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Telefone</p>
                    <p className="text-muted-foreground">{info.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {info?.whatsapp && (
                  <Button 
                    variant="imperial" 
                    onClick={handleWhatsApp}
                    className="flex-1"
                  >
                    <FaWhatsapp className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                )}
                {info?.instagram && (
                  <Button 
                    variant="imperial" 
                    onClick={handleInstagram}
                    className="flex-1"
                  >
                    <Instagram className="mr-2 h-5 w-5" />
                    Instagram
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
