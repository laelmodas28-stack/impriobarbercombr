import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Building } from "lucide-react";

export function BarbershopSettingsPage() {
  return (
    <AdminPageScaffold
      title="Perfil da Barbearia"
      subtitle="Dados e configuracoes do estabelecimento"
      icon={Building}
    />
  );
}

export default BarbershopSettingsPage;
