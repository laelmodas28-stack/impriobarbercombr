import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  QrCode,
  Bell,
  Send,
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  AlertCircle,
  LogOut,
  Trash2
} from "lucide-react";
import { 
  testEvolutionApiConnection, 
  getInstanceStatus,
  createEvolutionInstance,
  logoutEvolutionInstance,
  type ConnectionStatus 
} from "@/lib/notifications/evolutionApi";
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
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeExpiry, setQrCodeExpiry] = useState<number | null>(null);

  const isConfigured = !!(
    settings.evolution_api_url && 
    settings.evolution_api_key && 
    settings.evolution_instance_name
  );

  const checkConnectionStatus = useCallback(async () => {
    if (!isConfigured) {
      setConnectionStatus(null);
      return;
    }

    setIsLoadingStatus(true);
    try {
      const status = await getInstanceStatus(
        settings.evolution_api_url,
        settings.evolution_api_key,
        settings.evolution_instance_name
      );
      setConnectionStatus(status);

      // If not connected, get QR code
      if (status.state !== "open" && status.state !== "connected") {
        const result = await testEvolutionApiConnection(
          settings.evolution_api_url,
          settings.evolution_api_key,
          settings.evolution_instance_name
        );
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setQrCodeExpiry(Date.now() + 40000); // QR codes typically expire in ~40s
        }
      } else {
        setQrCode(null);
        setQrCodeExpiry(null);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setConnectionStatus({ state: "error", message: "Erro ao verificar status" });
    } finally {
      setIsLoadingStatus(false);
    }
  }, [isConfigured, settings.evolution_api_url, settings.evolution_api_key, settings.evolution_instance_name]);

  // Check status on mount and when config changes
  useEffect(() => {
    if (isConfigured) {
      checkConnectionStatus();
    }
  }, [isConfigured, settings.evolution_api_url, settings.evolution_api_key, settings.evolution_instance_name]);

  // Auto-refresh status every 5 seconds when showing QR code
  useEffect(() => {
    if (qrCode && qrCodeExpiry) {
      const interval = setInterval(() => {
        checkConnectionStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [qrCode, qrCodeExpiry, checkConnectionStatus]);

  const handleCreateAndConnect = async () => {
    if (!settings.evolution_api_url || !settings.evolution_api_key || !settings.evolution_instance_name) {
      toast.error("Preencha todos os campos de configuração");
      return;
    }

    setIsCreating(true);
    try {
      // First create the instance
      const createResult = await createEvolutionInstance(
        settings.evolution_api_url,
        settings.evolution_api_key,
        settings.evolution_instance_name
      );

      if (!createResult.success) {
        toast.error(createResult.message);
        return;
      }

      toast.success(createResult.message);

      // Now get QR code for connection
      const result = await testEvolutionApiConnection(
        settings.evolution_api_url,
        settings.evolution_api_key,
        settings.evolution_instance_name
      );

      if (result.success) {
        toast.success(result.message);
        setConnectionStatus({ state: "open" });
        setQrCode(null);
      } else {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setQrCodeExpiry(Date.now() + 40000);
          toast.info("Escaneie o QR Code para conectar seu WhatsApp");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Erro ao criar instância");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isConfigured) {
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
        setConnectionStatus({ state: "open" });
        setQrCode(null);
      } else {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setQrCodeExpiry(Date.now() + 40000);
          toast.info("Escaneie o QR Code para conectar");
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

  const handleLogout = async () => {
    if (!isConfigured) return;

    setIsLoggingOut(true);
    try {
      const result = await logoutEvolutionInstance(
        settings.evolution_api_url,
        settings.evolution_api_key,
        settings.evolution_instance_name
      );

      if (result.success) {
        toast.success(result.message);
        setConnectionStatus({ state: "close" });
        setQrCode(null);
        // Refresh to get new QR
        setTimeout(() => checkConnectionStatus(), 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao desconectar");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateSetting = <K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const getStatusBadge = () => {
    if (!isConfigured) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <XCircle className="w-3 h-3 mr-1" />
          Não configurado
        </Badge>
      );
    }

    if (isLoadingStatus) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Verificando...
        </Badge>
      );
    }

    if (!connectionStatus) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <AlertCircle className="w-3 h-3 mr-1" />
          Desconhecido
        </Badge>
      );
    }

    switch (connectionStatus.state) {
      case "open":
      case "connected":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <Wifi className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Conectando...
          </Badge>
        );
      case "close":
      case "disconnected":
        return (
          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
            <WifiOff className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <AlertCircle className="w-3 h-3 mr-1" />
            {connectionStatus.state}
          </Badge>
        );
    }
  };

  const isConnected = connectionStatus?.state === "open" || connectionStatus?.state === "connected";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isConnected ? "bg-green-500/10" : "bg-muted"}`}>
              <MessageCircle className={`w-5 h-5 ${isConnected ? "text-green-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base">WhatsApp (Evolution API)</CardTitle>
              <CardDescription>
                Envie mensagens automáticas via WhatsApp para seus clientes
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Switch
              checked={settings.whatsapp_enabled}
              onCheckedChange={(checked) => updateSetting("whatsapp_enabled", checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Fields */}
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
              onChange={(e) => updateSetting("evolution_instance_name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="minha-barbearia"
            />
            <p className="text-xs text-muted-foreground">
              Nome único para sua barbearia (será criado automaticamente)
            </p>
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
        </div>

        {/* Connection Status & QR Code Section */}
        {isConfigured && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Status da Conexão
                </h4>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={checkConnectionStatus}
                    disabled={isLoadingStatus || isTesting}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStatus ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {isConnected ? (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    WhatsApp conectado e pronto para enviar mensagens!
                    {connectionStatus?.phoneNumber && (
                      <span className="block text-sm mt-1">
                        Número: +{connectionStatus.phoneNumber}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : qrCode ? (
                <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-muted/30 border">
                  <div className="text-center">
                    <QrCode className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Escaneie o QR Code</p>
                    <p className="text-xs text-muted-foreground">
                      Abra o WhatsApp no seu celular e escaneie o código abaixo
                    </p>
                  </div>
                  <div className="relative">
                    <img 
                      src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} 
                      alt="QR Code WhatsApp" 
                      className="w-56 h-56 rounded-lg border bg-white p-2"
                    />
                    {isLoadingStatus && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    O QR Code atualiza automaticamente. Após escanear, aguarde a conexão.
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {connectionStatus?.message || "Clique em 'Criar e Conectar' para configurar seu WhatsApp"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isConnected && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCreateAndConnect}
              disabled={!isConfigured || isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              Criar e Conectar
            </Button>
          )}
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
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Verificar Conexão
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

        {/* Message Types */}
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
              disabled={!settings.whatsapp_enabled || !isConnected}
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
              disabled={!settings.whatsapp_enabled || !isConnected}
            />
          </div>

          {!isConnected && settings.whatsapp_enabled && (
            <p className="text-xs text-muted-foreground text-center">
              Conecte o WhatsApp para habilitar os tipos de mensagem
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
