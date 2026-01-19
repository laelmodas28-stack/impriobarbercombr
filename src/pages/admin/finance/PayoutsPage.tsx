import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { CreditCard } from "lucide-react";

export function PayoutsPage() {
  return (
    <AdminPageScaffold
      title="Pagamentos"
      subtitle="Pagamentos realizados a profissionais e fornecedores"
      icon={CreditCard}
    />
  );
}

export default PayoutsPage;
