import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { MessageSquare } from "lucide-react";

export function NotificationChannelsPage() {
  return (
    <AdminPageScaffold
      title="Canais de Notificacao"
      subtitle="Configure WhatsApp, Email e SMS"
      icon={MessageSquare}
    />
  );
}

export default NotificationChannelsPage;
