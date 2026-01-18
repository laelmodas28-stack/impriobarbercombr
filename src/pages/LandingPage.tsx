import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
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
  Zap,
  Database,
  Clock,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Palette,
  Play,
  Check,
  X
} from "lucide-react";
import imperioLogo from "@/assets/imperio-logo.webp";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Agendamento Inteligente",
      description: "Sistema de agendamento online 24/7 com confirmação automática"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Controle completo de profissionais, escalas e comissões"
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Dashboards com métricas de faturamento em tempo real"
    },
    {
      icon: Bell,
      title: "Notificações Smart",
      description: "Lembretes automáticos via WhatsApp e push"
    },
    {
      icon: Palette,
      title: "Marca Própria",
      description: "Personalize cores, logo e visual da sua barbearia"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Dados protegidos com criptografia de ponta"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      period: "para sempre",
      description: "Perfeito para começar",
      popular: false,
      features: [
        { text: "Até 50 agendamentos/mês", included: true },
        { text: "1 profissional", included: true },
        { text: "Página personalizada", included: true },
        { text: "Notificações básicas", included: true },
        { text: "Relatórios básicos", included: false },
        { text: "Suporte prioritário", included: false },
      ]
    },
    {
      name: "Professional",
      price: "R$ 49",
      period: "/mês",
      description: "O mais escolhido",
      popular: true,
      features: [
        { text: "Agendamentos ilimitados", included: true },
        { text: "Até 5 profissionais", included: true },
        { text: "Página personalizada", included: true },
        { text: "Notificações WhatsApp", included: true },
        { text: "Relatórios completos", included: true },
        { text: "Suporte prioritário", included: false },
      ]
    },
    {
      name: "Enterprise",
      price: "R$ 99",
      period: "/mês",
      description: "Para grandes operações",
      popular: false,
      features: [
        { text: "Agendamentos ilimitados", included: true },
        { text: "Profissionais ilimitados", included: true },
        { text: "Multi-unidades", included: true },
        { text: "API personalizada", included: true },
        { text: "Relatórios avançados", included: true },
        { text: "Suporte 24/7 dedicado", included: true },
      ]
    }
  ];

  const stats = [
    { value: "500+", label: "Barbearias", icon: Scissors },
    { value: "50k+", label: "Agendamentos", icon: Calendar },
    { value: "99.9%", label: "Uptime", icon: Zap },
    { value: "4.9★", label: "Avaliação", icon: Star }
  ];

  const workflow = [
    {
      step: "01",
      title: "Cadastre sua Barbearia",
      description: "Em menos de 2 minutos você configura tudo",
      icon: Database
    },
    {
      step: "02", 
      title: "Personalize sua Página",
      description: "Adicione logo, serviços e profissionais",
      icon: Palette
    },
    {
      step: "03",
      title: "Compartilhe com Clientes",
      description: "Link exclusivo para agendamentos online",
      icon: MessageSquare
    },
    {
      step: "04",
      title: "Gerencie e Cresça",
      description: "Acompanhe métricas e aumente faturamento",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={imperioLogo} alt="ImperioApp" className="h-9 w-auto" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ImperioApp
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button variant="premium" size="sm" onClick={() => navigate("/registro-barbeiro")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background to-background" />
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium tracking-wide">
              PLATAFORMA Nº 1 PARA BARBEARIAS NO BRASIL
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            Sua barbearia no
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              próximo nível
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Agendamento online, gestão de equipe, relatórios inteligentes. 
            Tudo que você precisa para transformar sua barbearia em um negócio moderno.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button 
              size="lg" 
              variant="premium"
              className="text-base px-8 h-12 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.5)] transition-shadow"
              onClick={() => navigate("/registro-barbeiro")}
            >
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-base px-8 h-12 border-border/60 hover:bg-muted/50"
            >
              <Play className="w-4 h-4 mr-2" />
              Ver Demo
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-60" />
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-4 shadow-2xl">
              {/* Mock Dashboard */}
              <div className="bg-background rounded-xl overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs text-muted-foreground">app.imperioapp.com.br</div>
                  <div className="w-16" />
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Hoje", value: "12", sublabel: "agendamentos", color: "primary" },
                      { label: "Semana", value: "R$ 2.450", sublabel: "faturamento", color: "green-500" },
                      { label: "Taxa", value: "95%", sublabel: "confirmação", color: "primary" },
                      { label: "Avaliação", value: "4.9★", sublabel: "média", color: "yellow-500" }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                        <div className={`text-lg font-bold text-${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-muted-foreground">{stat.sublabel}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Appointments List */}
                  <div className="space-y-2">
                    {[
                      { name: "João Silva", service: "Corte + Barba", time: "09:00", status: "confirmed" },
                      { name: "Pedro Santos", service: "Corte Degradê", time: "10:30", status: "pending" },
                      { name: "Lucas Costa", service: "Barba Completa", time: "11:00", status: "confirmed" }
                    ].map((apt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                            {apt.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{apt.name}</div>
                            <div className="text-xs text-muted-foreground">{apt.service}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {apt.time}
                          </div>
                          <Badge 
                            variant={apt.status === "confirmed" ? "default" : "secondary"}
                            className={`text-[10px] ${apt.status === "confirmed" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
                          >
                            {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border/30 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas completas para modernizar sua barbearia e aumentar o faturamento
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Como Funciona
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece em 4 passos simples
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Configure sua barbearia em minutos e comece a receber agendamentos hoje
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((item, index) => (
              <div key={item.step} className="relative">
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-0" />
                )}
                <Card className="bg-card/50 border-border/50 relative z-10">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
                      <span className="text-lg font-bold text-primary">{item.step}</span>
                    </div>
                    <div className="w-10 h-10 mx-auto rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Planos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative bg-card/50 border-border/50 ${
                  plan.popular 
                    ? "border-primary/50 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]" 
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground/60"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={plan.popular ? "premium" : "outline"}
                    onClick={() => navigate("/registro-barbeiro")}
                  >
                    {plan.price === "Grátis" ? "Começar Grátis" : "Escolher Plano"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Database/Tech Section */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                Tecnologia
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Infraestrutura robusta para seu negócio
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Utilizamos as mesmas tecnologias de empresas como Spotify, Netflix e Notion 
                para garantir que sua barbearia tenha a melhor experiência possível.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Database, title: "Banco de Dados Seguro", desc: "PostgreSQL com backup automático" },
                  { icon: Shield, title: "Criptografia End-to-End", desc: "Dados protegidos em trânsito e repouso" },
                  { icon: Zap, title: "99.9% de Disponibilidade", desc: "Servidores redundantes globais" },
                  { icon: Clock, title: "Sync em Tempo Real", desc: "Atualizações instantâneas para toda equipe" }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
                <div className="text-xs text-muted-foreground mb-4 font-mono">// Estrutura de Dados</div>
                
                {/* Schema Visual */}
                <div className="space-y-3">
                  {[
                    { name: "barbershops", cols: ["id", "name", "slug", "logo"], color: "primary" },
                    { name: "professionals", cols: ["id", "name", "specialties", "rating"], color: "green-500" },
                    { name: "services", cols: ["id", "name", "price", "duration"], color: "blue-500" },
                    { name: "bookings", cols: ["id", "client", "date", "status"], color: "purple-500" }
                  ].map((table, i) => (
                    <div key={table.name} className="p-3 bg-muted/30 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className={`w-4 h-4 text-${table.color}`} />
                        <span className="text-sm font-mono font-medium">{table.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {table.cols.map((col) => (
                          <span key={col} className="px-2 py-0.5 bg-background/50 rounded text-[10px] font-mono text-muted-foreground">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connections */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Relacionamentos</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sincronizado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="relative bg-card/80 backdrop-blur border border-primary/20 rounded-3xl p-8 md:p-16 text-center">
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar sua barbearia?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Junte-se a centenas de barbearias que já estão crescendo com o ImperioApp. 
                Comece gratuitamente hoje.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg" 
                  variant="premium"
                  className="text-base px-10 h-12 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]"
                  onClick={() => navigate("/registro-barbeiro")}
                >
                  
                  Criar Minha Barbearia
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-base px-8 h-12"
                  onClick={() => navigate("/auth")}
                >
                  Já tenho conta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={imperioLogo} alt="ImperioApp" className="h-8 w-auto opacity-80" />
              <span className="font-semibold text-muted-foreground">ImperioApp</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
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
