import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { UserCheck } from "lucide-react";

export function RetentionReportPage() {
  return (
    <AdminPageScaffold
      title="Retencao de Clientes"
      subtitle="Taxa de retorno e fidelizacao"
      icon={UserCheck}
    />
  );
}

export default RetentionReportPage;
