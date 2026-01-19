import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { BarChart3 } from "lucide-react";

export function RevenueReportPage() {
  return (
    <AdminPageScaffold
      title="Relatorio de Receita"
      subtitle="Analise detalhada de faturamento por periodo"
      icon={BarChart3}
    />
  );
}

export default RevenueReportPage;
