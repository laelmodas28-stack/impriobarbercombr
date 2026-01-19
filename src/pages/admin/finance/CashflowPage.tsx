import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { TrendingUp } from "lucide-react";

export function CashflowPage() {
  return (
    <AdminPageScaffold
      title="Fluxo de Caixa"
      subtitle="Entradas e saidas financeiras"
      icon={TrendingUp}
    />
  );
}

export default CashflowPage;
