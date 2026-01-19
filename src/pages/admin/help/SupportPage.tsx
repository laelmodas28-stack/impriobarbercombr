import { useState } from "react";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { HelpCircle, MessageCircle, Mail, Phone, ExternalLink, Send, Loader2, BookOpen, FileQuestion, Bug, Lightbulb } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Agendamentos",
    question: "Como cancelar um agendamento?",
    answer: "Acesse a página de Agendamentos, encontre o agendamento desejado e clique no botão de cancelar. Você também pode alterar o status diretamente na visualização de calendário.",
  },
  {
    category: "Agendamentos",
    question: "Como configurar os horários de atendimento?",
    answer: "Vá em Configurações > Perfil da Barbearia e configure os horários de funcionamento para cada dia da semana. Você pode definir horários diferentes para cada dia.",
  },
  {
    category: "Profissionais",
    question: "Como adicionar um novo barbeiro?",
    answer: "Acesse Profissionais > Lista de Profissionais e clique em 'Novo Profissional'. Preencha os dados e configure as especialidades e horários de atendimento.",
  },
  {
    category: "Profissionais",
    question: "Como definir comissões para os profissionais?",
    answer: "Na página do profissional, você pode definir a porcentagem de comissão. O sistema calculará automaticamente os valores nas páginas de Finanças.",
  },
  {
    category: "Finanças",
    question: "Como gerar relatórios financeiros?",
    answer: "Acesse Relatórios > Receita para visualizar gráficos e métricas. Você pode exportar os dados em CSV ou JSON através da Central de Exportação.",
  },
  {
    category: "Clientes",
    question: "Como segmentar meus clientes?",
    answer: "Acesse Clientes > Segmentos para criar tags e grupos. Você pode usar essas segmentações para campanhas de marketing e análises de retenção.",
  },
  {
    category: "Configurações",
    question: "Como integrar pagamentos online?",
    answer: "Vá em Configurações > Integrações e configure o MercadoPago com suas credenciais. Após a integração, os clientes poderão pagar online ao agendar.",
  },
  {
    category: "Configurações",
    question: "Como personalizar o tema da minha página?",
    answer: "Em Configurações > Perfil da Barbearia, você pode alterar o logo, cores e informações que aparecem na página pública da sua barbearia.",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "Chat ao Vivo",
    description: "Fale conosco em tempo real",
    action: "Iniciar Chat",
    available: true,
  },
  {
    icon: Mail,
    title: "E-mail",
    description: "suporte@imperio.app",
    action: "Enviar E-mail",
    available: true,
  },
  {
    icon: Phone,
    title: "Telefone",
    description: "(11) 99999-9999",
    action: "Ligar Agora",
    available: true,
  },
];

export function SupportPage() {
  const { barbershop } = useBarbershopContext();
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Ticket enviado com sucesso! Responderemos em até 24 horas.");
    setTicketForm({ subject: "", category: "general", message: "" });
    setIsSubmitting(false);
  };

  const groupedFAQ = FAQ_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (!barbershop?.id) {
    return <AdminPageScaffold title="Suporte" subtitle="Entre em contato com nossa equipe" icon={HelpCircle} />;
  }

  return (
    <AdminPageScaffold
      title="Suporte"
      subtitle="Entre em contato com nossa equipe de suporte"
      icon={HelpCircle}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTACT_OPTIONS.map((option, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      {option.action}
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5" />
                Perguntas Frequentes
              </CardTitle>
              <CardDescription>Encontre respostas para as dúvidas mais comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedFAQ).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                    {items.map((item, index) => (
                      <AccordionItem key={index} value={`${category}-${index}`}>
                        <AccordionTrigger className="text-left text-sm">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Support Ticket Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Abrir Ticket de Suporte
              </CardTitle>
              <CardDescription>Descreva seu problema e responderemos em até 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Resumo do problema"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "general", label: "Dúvida Geral", icon: HelpCircle },
                      { id: "bug", label: "Reportar Bug", icon: Bug },
                      { id: "feature", label: "Sugestão", icon: Lightbulb },
                      { id: "billing", label: "Financeiro", icon: Mail },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTicketForm(prev => ({ ...prev, category: cat.id }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                          ticketForm.category === cat.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <cat.icon className={`w-4 h-4 ${ticketForm.category === cat.id ? "text-primary" : "text-muted-foreground"}`} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Descreva seu problema em detalhes. Quanto mais informações, mais rápido poderemos ajudar."
                    rows={5}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Enviando..." : "Enviar Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Documentação Completa</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Acesse nossa documentação para guias detalhados, tutoriais em vídeo e dicas de uso.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ver Documentação
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Status do Sistema
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageScaffold>
  );
}

export default SupportPage;
