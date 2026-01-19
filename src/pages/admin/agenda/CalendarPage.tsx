import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { CalendarDays } from "lucide-react";

export function CalendarPage() {
  return (
    <AdminPageScaffold
      title="Calendario"
      subtitle="Visualizacao em calendario de todos os agendamentos"
      icon={CalendarDays}
    />
  );
}

export default CalendarPage;
