import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Wallet } from "lucide-react";

export function FinanceOverviewPage() {
  return (
    <AdminPageScaffold
      title="Visao Geral Financeira"
      subtitle="Resumo financeiro da barbearia"
      icon={Wallet}
    />
  );
}

export default FinanceOverviewPage;
