import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useBarbershop } from "@/hooks/useBarbershop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Crown, Calendar, Award } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { barbershop } = useBarbershop();
  const { plans, plansLoading, clientSubscriptions, activeSubscription, refetchSubscriptions } = useSubscriptions(barbershop?.id);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Faça login para assinar um plano");
      navigate("/auth");
      return;
    }

    if (!barbershop) {
      toast.error("Barbearia não encontrada");
      return;
    }

    // Verificar se já tem assinatura ativa
    if (activeSubscription) {
      toast.error("Você já possui uma assinatura ativa");
      return;
    }

    try {
      const plan = plans?.find(p => p.id === planId);
      if (!plan) return;

      const startDate = new Date();
      const endDate = addDays(startDate, plan.duration_days);

      const { error } = await supabase
        .from("client_subscriptions")
        .insert({
          plan_id: planId,
          client_id: user.id,
          barbershop_id: barbershop.id,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: "active",
          payment_status: "paid", // Simulando pagamento aprovado
        });

      if (error) throw error;

      toast.success("Assinatura realizada com sucesso!");
      refetchSubscriptions();
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
      toast.error("Erro ao criar assinatura");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Crown className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold mb-2">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            Economize com nossos planos mensais
          </p>
        </div>

        {/* Assinatura Ativa */}
        {activeSubscription && (
          <Card className="border-primary mb-8 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Sua Assinatura Ativa
                  </CardTitle>
                  <CardDescription>
                    {activeSubscription.plan?.name}
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {activeSubscription.plan?.price}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(activeSubscription.end_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serviços Usados</p>
                  <p className="text-lg font-semibold">
                    {activeSubscription.services_used_this_month} 
                    {activeSubscription.plan?.max_services_per_month 
                      ? ` / ${activeSubscription.plan.max_services_per_month}`
                      : " / Ilimitado"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planos Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plansLoading ? (
            <p className="col-span-3 text-center text-muted-foreground">Carregando planos...</p>
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`border-border hover:shadow-gold transition-all ${
                  activeSubscription?.plan_id === plan.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-primary">
                      R$ {plan.price}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Serviços Incluídos:
                    </p>
                    <ul className="space-y-1 ml-6">
                      {plan.services_included && plan.services_included.length > 0 ? (
                        plan.services_included.map((serviceId) => (
                          <li key={serviceId} className="text-sm text-muted-foreground">
                            • Serviço incluído
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">• Todos os serviços</li>
                      )}
                    </ul>
                  </div>

                  {plan.max_services_per_month && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Até {plan.max_services_per_month} serviços por mês
                    </p>
                  )}

                  {plan.discount_percentage && plan.discount_percentage > 0 && (
                    <Badge variant="secondary">
                      {plan.discount_percentage}% de desconto
                    </Badge>
                  )}

                  <Button 
                    variant={activeSubscription?.plan_id === plan.id ? "outline" : "premium"}
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!activeSubscription}
                  >
                    {activeSubscription?.plan_id === plan.id 
                      ? "Plano Atual" 
                      : activeSubscription 
                        ? "Já possui assinatura"
                        : "Assinar Agora"
                    }
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum plano disponível no momento
              </p>
            </div>
          )}
        </div>

        {/* Histórico de Assinaturas */}
        {clientSubscriptions && clientSubscriptions.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Histórico de Assinaturas</CardTitle>
              <CardDescription>Suas assinaturas anteriores e atuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientSubscriptions.map((subscription) => (
                  <div 
                    key={subscription.id}
                    className="flex justify-between items-center p-4 bg-card/30 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{subscription.plan?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(subscription.start_date), "dd/MM/yyyy")} - {format(new Date(subscription.end_date), "dd/MM/yyyy")}
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Subscriptions;
