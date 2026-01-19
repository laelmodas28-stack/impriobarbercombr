import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  QrCode,
  Bell,
  Send
} from "lucide-react";
import { testEvolutionApiConnection } from "@/lib/notifications/evolutionApi";
import { toast } from "sonner";

interface WhatsAppSettings {
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
  whatsapp_enabled: boolean;
  whatsapp_send_booking_confirmation: boolean;
  whatsapp_send_booking_reminder: boolean;
}

interface WhatsAppChannelCardProps {
  settings: WhatsAppSettings;
  onSettingsChange: (settings: WhatsAppSettings) => void;
}

export function WhatsAppChannelCard({ settings, onSettingsChange }: WhatsAppChannelCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const isConfigured = !!(
    settings.evolution_api_url && 
    settings.evolution_api_key && 
    settings.evolution_instance_name
  );

  const handleTestConnection = async () => {
    if (!settings.evolution_api_url || !settings.evolution_api_key || !settings.evolution_instance_name) {
      toast.error("Preencha todos os campos de configuração");
      return;
    }

    setIsTesting(true);
    try {
      const result = await testEvolutionApiConnection(
        settings.evolution_api_url,
        settings.evolution_api_key,
        settings.evolution_instance_name
      );

      if (result.success) {
        toast.success(result.message);
      } else {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setQrCodeDialog(true);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  const updateSetting = <K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp (Evolution API)</CardTitle>
                <CardDescription>
                  Envie mensagens automáticas via WhatsApp para seus clientes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConfigured ? (
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
              <Switch
                checked={settings.whatsapp_enabled}
                onCheckedChange={(checked) => updateSetting("whatsapp_enabled", checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="evolution_url">URL do Servidor</Label>
              <Input
                id="evolution_url"
                type="url"
                value={settings.evolution_api_url}
                onChange={(e) => updateSetting("evolution_api_url", e.target.value)}
                placeholder="https://evolution.seudominio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evolution_instance">Nome da Instância</Label>
              <Input
                id="evolution_instance"
                type="text"
                value={settings.evolution_instance_name}
                onChange={(e) => updateSetting("evolution_instance_name", e.target.value)}
                placeholder="minha-barbearia"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="evolution_key">API Key</Label>
            <Input
              id="evolution_key"
              type="password"
              value={settings.evolution_api_key}
              onChange={(e) => updateSetting("evolution_api_key", e.target.value)}
              placeholder="Sua chave de API do Evolution"
            />
            <p className="text-xs text-muted-foreground">
              Configure uma instância no seu servidor Evolution API e use as credenciais aqui.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!isConfigured || isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
            >
              <a 
                href="https://doc.evolution-api.com/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentação
              </a>
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Tipos de Mensagem</h4>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Confirmação de Agendamento</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar mensagem quando um agendamento é criado
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.whatsapp_send_booking_confirmation}
                onCheckedChange={(checked) => 
                  updateSetting("whatsapp_send_booking_confirmation", checked)
                }
                disabled={!settings.whatsapp_enabled}
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
                checked={settings.whatsapp_send_booking_reminder}
                onCheckedChange={(checked) => 
                  updateSetting("whatsapp_send_booking_reminder", checked)
                }
                disabled={!settings.whatsapp_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog} onOpenChange={setQrCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrCode ? (
              <img 
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Após escanear, clique em "Testar Conexão" novamente para verificar
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
