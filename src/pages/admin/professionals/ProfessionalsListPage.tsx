import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { UserCircle } from "lucide-react";

export function ProfessionalsListPage() {
  return (
    <AdminPageScaffold
      title="Equipe"
      subtitle="Profissionais cadastrados na barbearia"
      icon={UserCircle}
      actionLabel="Novo Profissional"
      onAction={() => {}}
    />
  );
}

export default ProfessionalsListPage;
