import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { FileText } from "lucide-react";

export function NotificationTemplatesPage() {
  return (
    <AdminPageScaffold
      title="Templates de Notificacao"
      subtitle="Modelos de mensagens para envios automaticos"
      icon={FileText}
      actionLabel="Novo Template"
      onAction={() => {}}
    />
  );
}

export default NotificationTemplatesPage;
