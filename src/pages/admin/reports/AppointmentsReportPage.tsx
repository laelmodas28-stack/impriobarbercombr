import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { PieChart } from "lucide-react";

export function AppointmentsReportPage() {
  return (
    <AdminPageScaffold
      title="Relatorio de Agendamentos"
      subtitle="Estatisticas e analises de agendamentos"
      icon={PieChart}
    />
  );
}

export default AppointmentsReportPage;
