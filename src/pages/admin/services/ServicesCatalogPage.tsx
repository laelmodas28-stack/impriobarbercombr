import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Scissors } from "lucide-react";

export function ServicesCatalogPage() {
  return (
    <AdminPageScaffold
      title="Catalogo de Servicos"
      subtitle="Todos os servicos oferecidos pela barbearia"
      icon={Scissors}
      actionLabel="Novo Servico"
      onAction={() => {}}
    />
  );
}

export default ServicesCatalogPage;
