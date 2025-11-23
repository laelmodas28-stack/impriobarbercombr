import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Services = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Nossos Serviços</h1>
          <p className="text-muted-foreground text-lg">
            Conheça todos os serviços premium que oferecemos
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando serviços...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((service) => (
              <Card key={service.id} className="border-border hover:shadow-gold transition-all">
                <CardHeader>
                  <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-gradient-primary flex items-center justify-center overflow-hidden">
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Scissors className="w-12 h-12 text-primary-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-center text-xl">{service.name}</CardTitle>
                  <CardDescription className="text-center">
                    {service.description || "Serviço profissional"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Preço</p>
                      <p className="text-3xl font-bold text-primary">
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Duração</p>
                      <p className="text-2xl font-semibold">
                        {service.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <Link to="/booking" state={{ selectedService: service }}>
                    <Button variant="premium" className="w-full">
                      Agendar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
