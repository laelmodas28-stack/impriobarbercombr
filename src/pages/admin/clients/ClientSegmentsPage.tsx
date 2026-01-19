import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { Tags } from "lucide-react";

export function ClientSegmentsPage() {
  return (
    <AdminPageScaffold
      title="Segmentos"
      subtitle="Tags e segmentacao de clientes para campanhas e analises"
      icon={Tags}
      actionLabel="Novo Segmento"
      onAction={() => {}}
    />
  );
}

export default ClientSegmentsPage;
