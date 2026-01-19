import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Settings } from "lucide-react";

export function PreferencesPage() {
  return (
    <AdminPageScaffold
      title="Preferencias"
      subtitle="Configuracoes gerais do sistema"
      icon={Settings}
    />
  );
}

export default PreferencesPage;
