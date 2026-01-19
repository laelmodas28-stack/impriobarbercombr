import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Puzzle } from "lucide-react";

export function IntegrationsPage() {
  return (
    <AdminPageScaffold
      title="Integracoes"
      subtitle="Conecte servicos externos a barbearia"
      icon={Puzzle}
    />
  );
}

export default IntegrationsPage;
