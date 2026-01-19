import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Download } from "lucide-react";

export function ExportCenterPage() {
  return (
    <AdminPageScaffold
      title="Central de Exportacao"
      subtitle="Exporte dados da barbearia em diversos formatos"
      icon={Download}
    />
  );
}

export default ExportCenterPage;
