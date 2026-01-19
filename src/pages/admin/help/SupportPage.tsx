import { AdminPageScaffold } from "@/components/admin/shared/AdminPageScaffold";
import { HelpCircle } from "lucide-react";

export function SupportPage() {
  return (
    <AdminPageScaffold
      title="Suporte"
      subtitle="Entre em contato com nossa equipe de suporte"
      icon={HelpCircle}
    />
  );
}

export default SupportPage;
