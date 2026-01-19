import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Shield } from "lucide-react";

export function UsersRolesPage() {
  return (
    <AdminPageScaffold
      title="Usuarios e Funcoes"
      subtitle="Gerencie usuarios e permissoes de acesso"
      icon={Shield}
      actionLabel="Convidar Usuario"
      onAction={() => {}}
    />
  );
}

export default UsersRolesPage;
