import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { History } from "lucide-react";

export function ClientHistoryPage() {
  return (
    <AdminPageScaffold
      title="Historico de Clientes"
      subtitle="Historico completo de atendimentos por cliente"
      icon={History}
    />
  );
}

export default ClientHistoryPage;
