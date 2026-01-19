import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { DollarSign } from "lucide-react";

export function ServicesPricingPage() {
  return (
    <AdminPageScaffold
      title="Precos"
      subtitle="Tabela de precos e promocoes"
      icon={DollarSign}
    />
  );
}

export default ServicesPricingPage;
