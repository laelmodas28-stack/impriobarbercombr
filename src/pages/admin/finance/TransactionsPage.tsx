import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Receipt } from "lucide-react";

export function TransactionsPage() {
  return (
    <AdminPageScaffold
      title="Transacoes"
      subtitle="Historico de todas as transacoes financeiras"
      icon={Receipt}
    />
  );
}

export default TransactionsPage;
