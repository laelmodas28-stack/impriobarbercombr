import { useState } from "react";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Puzzle, CreditCard, MessageCircle, Calendar, Bell, ExternalLink, Settings, CheckCircle, XCircle } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "connected" | "disconnected" | "coming_soon";
  category: "payments" | "communication" | "calendar" | "notifications";
  configurable: boolean;
}

const integrations: Integration[] = [
  {
    id: "mercadopago",
    name: "MercadoPago",
    description: "Aceite pagamentos online via cartão, PIX e boleto",
    icon: CreditCard,
    status: "disconnected",
    category: "payments",
    configurable: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envie lembretes e confirmações automáticas via WhatsApp",
    icon: MessageCircle,
    status: "disconnected",
    category: "communication",
    configurable: true,
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincronize agendamentos com Google Calendar",
    icon: Calendar,
    status: "coming_soon",
    category: "calendar",
    configurable: false,
  },
  {
    id: "push_notifications",
    name: "Push Notifications",
    description: "Notificações push para o navegador",
    icon: Bell,
    status: "disconnected",
    category: "notifications",
    configurable: true,
  },
];

export function IntegrationsPage() {
  const { barbershop } = useBarbershopContext();
  const [configDialog, setConfigDialog] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigure = (integration: Integration) => {
    setApiKey("");
    setConfigDialog(integration);
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      toast.error("Preencha a chave de API");
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`${configDialog?.name} configurado com sucesso!`);
    setConfigDialog(null);
    setApiKey("");
    setIsSaving(false);
  };

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge variant="secondary">
            Em breve
          </Badge>
        );
    }
  };

  const getCategoryLabel = (category: Integration["category"]) => {
    const labels: Record<Integration["category"], string> = {
      payments: "Pagamentos",
      communication: "Comunicação",
      calendar: "Calendário",
      notifications: "Notificações",
    };
    return labels[category];
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  if (!barbershop?.id) {
    return (
      <AdminPageScaffold
        title="Integrações"
        subtitle="Conecte serviços externos à barbearia"
        icon={Puzzle}
      />
    );
  }

  return (
    <AdminPageScaffold
      title="Integrações"
      subtitle="Conecte serviços externos à barbearia"
      icon={Puzzle}
    >
      <div className="space-y-8">
        {Object.entries(groupedIntegrations).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold">{getCategoryLabel(category as Integration["category"])}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((integration) => (
                <Card key={integration.id} className={integration.status === "coming_soon" ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <integration.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(integration.status)}
                      
                      {integration.configurable && integration.status !== "coming_soon" && (
                        <Button
                          variant={integration.status === "connected" ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleConfigure(integration)}
                        >
                          {integration.status === "connected" ? (
                            <>
                              <Settings className="w-4 h-4 mr-2" />
                              Configurar
                            </>
                          ) : (
                            "Conectar"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Help Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Puzzle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Precisa de outra integração?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Estamos sempre adicionando novas integrações. Entre em contato para sugerir uma nova integração.
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Sugerir Integração
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configDialog && <configDialog.icon className="w-5 h-5" />}
              Configurar {configDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Insira as credenciais para conectar {configDialog?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {configDialog?.id === "mercadopago" ? "Access Token" : "Chave de API"}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={configDialog?.id === "mercadopago" ? "APP_USR-..." : "Sua chave de API"}
              />
              <p className="text-xs text-muted-foreground">
                {configDialog?.id === "mercadopago" && (
                  <>Obtenha seu Access Token em{" "}
                    <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      mercadopago.com.br/developers
                    </a>
                  </>
                )}
                {configDialog?.id === "whatsapp" && (
                  <>Configure a API do WhatsApp Business</>
                )}
              </p>
            </div>

            {configDialog?.id === "mercadopago" && (
              <div className="space-y-2">
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  type="text"
                  placeholder="APP_USR-..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageScaffold>
  );
}

export default IntegrationsPage;
