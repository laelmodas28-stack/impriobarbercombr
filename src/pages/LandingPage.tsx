import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Crown, 
  Calendar, 
  Users, 
  BarChart3, 
  Smartphone, 
  Bell, 
  Scissors, 
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";
import imperioLogo from "@/assets/imperio-logo.webp";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Agendamento Online",
      description: "Seus clientes agendam 24h por dia, sem ligações ou mensagens"
    },
    {
      icon: Users,
      title: "Gestão de Profissionais",
      description: "Controle completo da equipe, comissões e desempenho"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Métricas de faturamento, serviços mais populares e mais"
    },
    {
      icon: Bell,
      title: "Notificações Automáticas",
      description: "Lembretes por WhatsApp para reduzir faltas"
    },
    {
      icon: Smartphone,
      title: "App Personalizado",
      description: "Sua barbearia com visual exclusivo e sua marca"
    },
    {
      icon: Shield,
      title: "Dados Seguros",
      description: "Proteção total das informações dos seus clientes"
    }
  ];

  const benefits = [
    "Reduza no-shows em até 70%",
    "Aumente o faturamento com agendamentos 24h",
    "Elimine conflitos de horário",
    "Fidelize clientes com lembretes automáticos",
    "Acompanhe métricas em tempo real",
    "Controle comissões automaticamente"
  ];

  const testimonials = [
    {
      name: "Ricardo Silva",
      role: "Barbearia Premium",
      content: "Desde que começamos a usar o ImperioApp, nossos agendamentos aumentaram 40%.",
      rating: 5
    },
    {
      name: "Fernando Costa",
      role: "Barber House",
      content: "A gestão de comissões ficou muito mais fácil. Recomendo demais!",
      rating: 5
    },
    {
      name: "Carlos Oliveira",
      role: "Studio Cortes",
      content: "O melhor investimento que fiz para minha barbearia. Sistema completo!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={imperioLogo} 
              alt="ImperioApp" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-primary">ImperioApp</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
            >
              Entrar
            </Button>
            <Button 
              variant="premium" 
              onClick={() => navigate("/registro-barbeiro")}
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Sistema #1 para Barbearias</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Transforme sua Barbearia em um
            <span className="text-primary block mt-2">Império Digital</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Agendamento online, gestão completa de profissionais, 
            relatórios inteligentes e muito mais. Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              variant="premium"
              className="text-lg px-8 py-6 shadow-[var(--shadow-gold)]"
              onClick={() => navigate("/registro-barbeiro")}
            >
              <Crown className="w-5 h-5 mr-2" />
              Criar Minha Barbearia
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Já tenho conta
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Barbearias" },
              { value: "10k+", label: "Agendamentos/mês" },
              { value: "98%", label: "Satisfação" },
              { value: "24/7", label: "Disponível" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Funcionalidades completas para modernizar e impulsionar seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="bg-card border-border hover:border-primary/50 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Resultados Comprovados
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o ImperioApp?
              </h2>
              <p className="text-muted-foreground mb-8">
                Desenvolvido por quem entende de barbearias, para quem vive de barbearias.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="premium" 
                size="lg" 
                className="mt-8"
                onClick={() => navigate("/registro-barbeiro")}
              >
                Quero esses resultados
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Novo agendamento</div>
                    <div className="text-sm text-muted-foreground">João Silva • Corte + Barba</div>
                  </div>
                  <div className="ml-auto text-primary font-semibold">R$ 65</div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold">Confirmado</div>
                    <div className="text-sm text-muted-foreground">Pedro Costa • 14:30</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Faturamento do dia</div>
                    <div className="text-sm text-muted-foreground">12 atendimentos</div>
                  </div>
                  <div className="ml-auto text-primary font-semibold">R$ 890</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que dizem nossos clientes
            </h2>
            <p className="text-muted-foreground">
              Barbearias de todo o Brasil já estão transformando seus negócios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <div className="relative bg-card border border-primary/20 rounded-3xl p-8 md:p-16 text-center">
              <Crown className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Pronto para transformar sua barbearia?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Comece agora gratuitamente e veja a diferença em poucos dias.
              </p>
              <Button 
                size="lg" 
                variant="premium"
                className="text-lg px-10 py-6 shadow-[var(--shadow-gold)]"
                onClick={() => navigate("/registro-barbeiro")}
              >
                <Crown className="w-5 h-5 mr-2" />
                Começar Gratuitamente
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={imperioLogo} 
                alt="ImperioApp" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-primary">ImperioApp</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ImperioApp. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
