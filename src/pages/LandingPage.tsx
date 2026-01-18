import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DemoTour } from "@/components/DemoTour";
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Bell, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  Database,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Zap,
  PlayCircle,
  Check,
  X,
  Menu,
  X as XIcon,
  FileText,
  DollarSign,
  UserCog,
  Brain,
  Star,
  ChevronDown
} from "lucide-react";
import imperioLogo from "@/assets/imperio-logo.webp";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDemoTour, setShowDemoTour] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={imperioLogo} alt="Império App" className="h-8 w-auto" />
              <span className="text-lg font-bold text-foreground">Império App</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Planos
              </button>
              <button 
                onClick={() => scrollToSection("how-it-works")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <button 
                onClick={() => scrollToSection("contact")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contato
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/auth")}
                className="hidden sm:inline-flex"
              >
                Entrar
              </Button>
              <Button 
                variant="premium" 
                size="sm" 
                onClick={() => setShowDemoTour(true)}
                className="hidden sm:inline-flex"
              >
                Solicitar Demo
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 space-y-3">
              <button 
                onClick={() => scrollToSection("features")} 
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Planos
              </button>
              <button 
                onClick={() => scrollToSection("how-it-works")} 
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <button 
                onClick={() => scrollToSection("contact")} 
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contato
              </button>
              <div className="pt-3 border-t border-border/50 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/auth")}
                  className="w-full"
                >
                  Entrar
                </Button>
                <Button 
                  variant="premium" 
                  size="sm" 
                  onClick={() => setShowDemoTour(true)}
                  className="w-full"
                >
                  Solicitar Demo
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
                Organize sua barbearia e<br />
                <span className="text-primary">ganhe mais tempo</span> para cortar
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Plataforma completa de gestão: agendamentos online, controle de equipe, 
                pagamentos e relatórios. Tudo centralizado e automatizado para você focar no que importa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  variant="premium"
                  className="text-base px-8 h-12"
                  onClick={() => navigate("/registro-barbeiro")}
                >
                  Começar Gratuitamente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-base px-8 h-12"
                  onClick={() => setShowDemoTour(true)}
                >
                  Solicitar Demo
                </Button>
              </div>

              {/* Trust Bar */}
              <div className="flex flex-wrap gap-4">
                {["Agendamentos", "Pagamentos", "Lembretes", "Equipe", "Relatórios"].map((item) => (
                  <div key={item} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-card border border-border/60 rounded-2xl p-4 shadow-xl">
                <div className="bg-background rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs text-muted-foreground">app.imperioapp.com.br</div>
                    <div className="w-16" />
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Hoje", value: "12", sublabel: "agendamentos" },
                        { label: "Semana", value: "R$ 2.450", sublabel: "faturamento" },
                        { label: "Taxa", value: "95%", sublabel: "confirmação" }
                      ].map((stat) => (
                        <div key={stat.label} className="bg-muted/40 rounded-lg p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                          <div className="text-lg font-bold text-foreground">{stat.value}</div>
                          <div className="text-[10px] text-muted-foreground">{stat.sublabel}</div>
                        </div>
                      ))}
                    </div>
                    
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
                              className="text-[10px]"
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
        </div>
        <DemoTour open={showDemoTour} onOpenChange={setShowDemoTour} />
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 border-y border-border/30 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {["Empresa A", "Empresa B", "Empresa C", "Empresa D"].map((company) => (
              <div key={company} className="flex items-center justify-center h-12 text-muted-foreground/40 text-sm font-medium">
                {company}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Suporte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">-40%</div>
              <div className="text-sm text-muted-foreground">Menos no-shows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">5h/sem</div>
              <div className="text-sm text-muted-foreground">Tempo economizado</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem-to-Outcome Blocks */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Problemas do dia a dia resolvidos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Entendemos os desafios da gestão de barbearia e criamos soluções práticas para cada um deles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                problem: "No-shows frequentes",
                solution: "Lembretes automáticos e confirmações reduzem faltas em até 40%",
                icon: Bell
              },
              {
                problem: "Agenda desorganizada",
                solution: "Agendamento inteligente previne conflitos e otimiza horários",
                icon: Calendar
              },
              {
                problem: "Tempo perdido no WhatsApp",
                solution: "Comunicação centralizada economiza horas por semana",
                icon: MessageSquare
              },
              {
                problem: "Fluxo de caixa confuso",
                solution: "Pagamentos integrados e relatórios financeiros claros",
                icon: DollarSign
              },
              {
                problem: "Equipe desorganizada",
                solution: "Gestão de funções, serviços e comissões automatizada",
                icon: UserCog
              },
              {
                problem: "Falta de insights",
                solution: "Relatórios e análises para tomar decisões baseadas em dados",
                icon: BarChart3
              }
            ].map((item, index) => (
              <Card key={index} className="bg-card border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.problem}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.solution}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas completas para modernizar sua barbearia e aumentar o faturamento
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Agendamento Inteligente",
                description: "Sistema online 24/7 com prevenção de conflitos e otimização automática de horários"
              },
              {
                icon: Users,
                title: "Gestão de Clientes",
                description: "CRM completo com histórico, preferências e comunicação centralizada"
              },
              {
                icon: FileText,
                title: "Serviços e Preços",
                description: "Catálogo personalizável com preços flexíveis e pacotes promocionais"
              },
              {
                icon: Bell,
                title: "Lembretes Automáticos",
                description: "Confirmações e lembretes via WhatsApp para reduzir no-shows"
              },
              {
                icon: CreditCard,
                title: "Pagamentos e Assinaturas",
                description: "Aceite pagamentos online e gerencie planos de assinatura mensal"
              },
              {
                icon: BarChart3,
                title: "Relatórios e Insights",
                description: "Dashboards com métricas de faturamento, comparecimento e performance"
              },
              {
                icon: UserCog,
                title: "Gestão de Equipe",
                description: "Controle de profissionais, escalas, comissões e desempenho individual"
              },
              {
                icon: Brain,
                title: "Assistente Inteligente",
                description: "Sugestões automáticas, resumos diários e insights para otimizar operações"
              }
            ].map((feature) => (
              <Card 
                key={feature.title} 
                className="bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all group"
              >
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Como Funciona
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece em 3 passos simples
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure sua barbearia em minutos e comece a receber agendamentos hoje mesmo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Crie o perfil da sua barbearia e equipe",
                description: "Cadastre informações básicas, adicione profissionais e defina funções",
                icon: Users
              },
              {
                step: "2",
                title: "Configure serviços, preços e disponibilidade",
                description: "Adicione seus serviços, defina valores e horários de funcionamento",
                icon: Calendar
              },
              {
                step: "3",
                title: "Comece a agendar e automatize confirmações",
                description: "Compartilhe seu link e receba agendamentos com confirmações automáticas",
                icon: CheckCircle2
              }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-0" style={{ width: 'calc(100% - 3rem)' }} />
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

      {/* AI Assistant Section - Subtle */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                Automação Inteligente
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Automação que funciona enquanto você corta
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Nossa plataforma utiliza processamento inteligente para automatizar tarefas repetitivas 
                e fornecer insights que ajudam você a tomar decisões melhores para sua barbearia.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Mensagens automáticas", desc: "Lembretes e confirmações enviados no momento certo" },
                  { title: "Sugestões inteligentes", desc: "Recomendações de horários e serviços baseadas em histórico" },
                  { title: "Resumos diários", desc: "Visão consolidada da sua operação ao final de cada dia" },
                  { title: "Insights e tendências", desc: "Identificação de padrões para otimizar sua gestão" }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assistant Panel Mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/30">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Assistente de Gestão</span>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Resumo de hoje</div>
                    <div className="text-sm font-medium">12 agendamentos • 3 confirmados • R$ 450 previstos</div>
                  </div>
                  
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-xs text-primary font-medium mb-1">Sugestão</div>
                    <div className="text-sm">Horário das 15h tem alta taxa de no-show. Considere lembrete duplo.</div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Tendência</div>
                    <div className="text-sm font-medium">Corte + Barba cresceu 25% este mês</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos Mendes",
                role: "Proprietário",
                location: "São Paulo, SP",
                text: "Economizei pelo menos 5 horas por semana. A agenda organiza tudo sozinha e os clientes adoram a facilidade do agendamento online."
              },
              {
                name: "Ana Paula Silva",
                role: "Gestora",
                location: "Rio de Janeiro, RJ",
                text: "Os relatórios me ajudam a entender melhor o negócio. Consigo ver exatamente onde estamos indo bem e o que precisa melhorar."
              },
              {
                name: "Roberto Alves",
                role: "Dono",
                location: "Belo Horizonte, MG",
                text: "A redução de faltas foi impressionante. Os lembretes automáticos realmente funcionam e os clientes chegam muito mais preparados."
              }
            ].map((testimonial) => (
              <Card key={testimonial.name} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="pt-4 border-t border-border/30">
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.location}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Planos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative bg-card border-border/50 ${
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
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
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

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Perguntas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dúvidas Comuns
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "Como funciona o agendamento online?",
                answer: "Seus clientes acessam o link da sua barbearia e escolhem o serviço, profissional e horário disponível. O sistema previne conflitos e envia confirmação automática por WhatsApp."
              },
              {
                question: "Posso usar em múltiplas unidades?",
                answer: "Sim, o plano Enterprise permite gerenciar múltiplas barbearias em uma única conta, com relatórios consolidados e gestão centralizada."
              },
              {
                question: "Os dados dos meus clientes são seguros?",
                answer: "Sim. Utilizamos criptografia de ponta e seguimos todas as normas de proteção de dados pessoais (LGPD). Seus dados são armazenados em servidores seguros com backup automático."
              },
              {
                question: "Como funcionam os lembretes automáticos?",
                answer: "O sistema envia lembretes por WhatsApp 24 horas e 2 horas antes de cada agendamento. Isso reduz significativamente o número de faltas e no-shows."
              },
              {
                question: "Posso personalizar a página da minha barbearia?",
                answer: "Sim. Você pode adicionar seu logo, cores personalizadas, fotos dos profissionais, descrição dos serviços e outras informações para criar uma página única da sua marca."
              },
              {
                question: "Quanto tempo leva para configurar?",
                answer: "A configuração inicial leva menos de 10 minutos. Você cadastra informações básicas, adiciona profissionais, serviços e já pode começar a receber agendamentos."
              },
              {
                question: "O que acontece se eu cancelar?",
                answer: "Você pode cancelar a qualquer momento sem multa. Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação, caso necessário."
              },
              {
                question: "Oferece suporte técnico?",
                answer: "Sim. Oferecemos suporte por email e chat, com resposta em até 24 horas. Planos Professional e Enterprise incluem suporte prioritário."
              }
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={imperioLogo} alt="Império App" className="h-8 w-auto opacity-80" />
                <span className="font-semibold">Império App</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma de gestão para barbearias. Organize, automatize e cresça.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <button onClick={() => scrollToSection("features")} className="text-left hover:text-foreground transition-colors">
                  Funcionalidades
                </button>
                <button onClick={() => scrollToSection("pricing")} className="text-left hover:text-foreground transition-colors">
                  Planos
                </button>
                <button onClick={() => scrollToSection("how-it-works")} className="text-left hover:text-foreground transition-colors">
                  Como Funciona
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
                <button onClick={() => scrollToSection("faq")} className="text-left hover:text-foreground transition-colors">
                  FAQ
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div>Email: contato@imperioapp.com.br</div>
                <div>Telefone: (11) 0000-0000</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/auth")}
                  className="mt-2 w-fit"
                >
                  Suporte
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Império App. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
