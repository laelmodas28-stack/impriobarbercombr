import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Video } from "lucide-react";

export function TutorialsPage() {
  return (
    <AdminPageScaffold
      title="Tutoriais"
      subtitle="Aprenda a usar todas as funcionalidades do sistema"
      icon={Video}
    />
  );
}

export default TutorialsPage;
