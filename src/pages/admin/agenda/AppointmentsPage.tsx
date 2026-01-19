import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Calendar } from "lucide-react";

export function AppointmentsPage() {
  return (
    <AdminPageScaffold
      title="Agendamentos"
      subtitle="Gerencie todos os agendamentos da barbearia"
      icon={Calendar}
      actionLabel="Novo Agendamento"
      onAction={() => {}}
    />
  );
}

export default AppointmentsPage;
