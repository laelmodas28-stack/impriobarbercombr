import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { CalendarClock } from "lucide-react";

export function AvailabilityPage() {
  return (
    <AdminPageScaffold
      title="Disponibilidade"
      subtitle="Configure horarios e escalas dos profissionais"
      icon={CalendarClock}
    />
  );
}

export default AvailabilityPage;
