import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { Fragment } from "react";

const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  bookings: "Agendamentos",
  calendar: "Calendario",
  "waiting-list": "Lista de Espera",
  clients: "Clientes",
  history: "Historico",
  tags: "Tags e Segmentos",
  professionals: "Profissionais",
  availability: "Disponibilidade",
  commissions: "Comissoes",
  services: "Servicos",
  pricing: "Precos",
  finance: "Financeiro",
  transactions: "Transacoes",
  cashflow: "Fluxo de Caixa",
  subscriptions: "Assinaturas",
  invoices: "Faturas",
  status: "Status",
  reports: "Relatorios",
  revenue: "Receita",
  retention: "Retencao",
  export: "Central de Exportacao",
  imports: "Importacoes",
  "import-logs": "Logs de Importacao",
  gallery: "Galeria",
  notifications: "Notificacoes",
  "notification-templates": "Templates",
  "notification-settings": "Configuracoes WhatsApp/Email",
  "notification-logs": "Logs de Envio",
  settings: "Configuracoes",
  users: "Usuarios e Funcoes",
  integrations: "Integracoes",
  preferences: "Preferencias",
  tutorials: "Tutoriais",
  support: "Suporte",
  help: "Ajuda",
  new: "Novo",
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const { baseUrl } = useBarbershopContext();
  
  const adminBaseUrl = `${baseUrl}/admin`;
  const pathFromAdmin = location.pathname.replace(adminBaseUrl, "").replace(/^\//, "");
  const segments = pathFromAdmin.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={adminBaseUrl} className="text-muted-foreground hover:text-foreground">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const path = `${adminBaseUrl}/${segments.slice(0, index + 1).join("/")}`;
          const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={path} className="text-muted-foreground hover:text-foreground">
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AdminBreadcrumb;
