import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Clock } from "lucide-react";

export function WaitingListPage() {
  return (
    <AdminPageScaffold
      title="Lista de Espera"
      subtitle="Clientes aguardando disponibilidade de horario"
      icon={Clock}
      actionLabel="Adicionar a Lista"
      onAction={() => {}}
    />
  );
}

export default WaitingListPage;
