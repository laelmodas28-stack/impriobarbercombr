import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { PackagePlus } from "lucide-react";

export function ServicesAddonsPage() {
  return (
    <AdminPageScaffold
      title="Adicionais"
      subtitle="Servicos complementares e extras"
      icon={PackagePlus}
      actionLabel="Novo Adicional"
      onAction={() => {}}
    />
  );
}

export default ServicesAddonsPage;
