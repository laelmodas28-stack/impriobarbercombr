import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Save, 
  Loader2, 
  Webhook, 
  Mail, 
  Bell,
  CheckCircle,
  XCircle,
  ExternalLink,
  TestTube
} from "lucide-react";

interface NotificationSettings {
  n8n_webhook_url: string;
  send_booking_confirmation: boolean;
  send_booking_reminder: boolean;
}

export function NotificationChannelsPage() {
  const { barbershop } = useBarbershopContext();
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    n8n_webhook_url: "",
    send_booking_confirmation: true,
    send_booking_reminder: true,
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["barbershop-notification-settings", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return null;
      const { data, error } = await supabase
        .from("barbershop_settings")
        .select("n8n_webhook_url, send_booking_confirmation, send_booking_reminder")
        .eq("barbershop_id", barbershop.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!barbershop?.id,
  });

  useEffect(() => {
    if (settingsData) {
      setSettings({
        n8n_webhook_url: settingsData.n8n_webhook_url || "",
        send_booking_confirmation: settingsData.send_booking_confirmation ?? true,
        send_booking_reminder: settingsData.send_booking_reminder ?? true,
      });
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      if (!barbershop?.id) throw new Error("Barbearia não encontrada");
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from("barbershop_settings")
        .select("id")
        .eq("barbershop_id", barbershop.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("barbershop_settings")
          .update({
            n8n_webhook_url: data.n8n_webhook_url || null,
            send_booking_confirmation: data.send_booking_confirmation,
            send_booking_reminder: data.send_booking_reminder,
            updated_at: new Date().toISOString(),
          })
          .eq("barbershop_id", barbershop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("barbershop_settings")
          .insert({
            barbershop_id: barbershop.id,
            n8n_webhook_url: data.n8n_webhook_url || null,
            send_booking_confirmation: data.send_booking_confirmation,
            send_booking_reminder: data.send_booking_reminder,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["barbershop-notification-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  const handleTestWebhook = async () => {
    if (!settings.n8n_webhook_url) {
      toast.error("Configure a URL do webhook primeiro");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(settings.n8n_webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          type: "test",
          barbershop_name: barbershop?.name,
          timestamp: new Date().toISOString(),
          message: "Teste de integração n8n - Se você recebeu isso, a integração está funcionando!",
        }),
      });

      toast.success("Requisição enviada! Verifique seu workflow no n8n para confirmar.");
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast.error("Erro ao testar webhook. Verifique a URL.");
    } finally {
      setIsTesting(false);
    }
  };

  const isWebhookConfigured = !!settings.n8n_webhook_url;

  if (!barbershop?.id) {
    return (
      <AdminPageScaffold
        title="Canais de Notificação"
        subtitle="Configure como enviar notificações para seus clientes"
        icon={MessageSquare}
      />
    );
  }

  return (
    <AdminPageScaffold
      title="Canais de Notificação"
      subtitle="Configure como enviar notificações para seus clientes"
      icon={MessageSquare}
      actions={
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* n8n Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Webhook className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">n8n Webhook</CardTitle>
                    <CardDescription>
                      Integração com n8n para envio de emails via Gmail/SMTP
                    </CardDescription>
                  </div>
                </div>
                {isWebhookConfigured ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="w-3 h-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={settings.n8n_webhook_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, n8n_webhook_url: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/..."
                />
                <p className="text-xs text-muted-foreground">
                  Crie um workflow no n8n com trigger "Webhook" e cole a URL aqui.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebhook}
                  disabled={!isWebhookConfigured || isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Testar Webhook
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a 
                    href="https://docs.n8n.io/integrations/trigger-nodes/n8n-nodes-base.webhook/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Como configurar
                  </a>
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Tipos de Notificação</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Confirmação de Agendamento</p>
                      <p className="text-xs text-muted-foreground">
                        Enviar email quando um agendamento é criado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.send_booking_confirmation}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, send_booking_confirmation: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Lembrete de Agendamento</p>
                      <p className="text-xs text-muted-foreground">
                        Enviar lembrete antes do horário marcado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.send_booking_reminder}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, send_booking_reminder: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Payload Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Webhook className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Dados enviados para o n8n</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Quando um agendamento é criado, enviamos os seguintes dados para seu workflow:
                  </p>
                  <div className="bg-background rounded-lg p-4 text-xs font-mono overflow-x-auto">
                    <pre>{`{
  "type": "booking_confirmation",
  "barbershop_name": "Nome da Barbearia",
  "client_name": "Nome do Cliente",
  "client_email": "email@cliente.com",
  "client_phone": "11999999999",
  "service_name": "Corte de Cabelo",
  "professional_name": "João",
  "booking_date": "2025-01-20",
  "booking_time": "14:00",
  "price": 50.00,
  "notes": "Observações..."
}`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </AdminPageScaffold>
  );
}

export default NotificationChannelsPage;
