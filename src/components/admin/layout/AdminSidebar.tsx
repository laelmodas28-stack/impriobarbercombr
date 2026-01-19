import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Clock,
  Users,
  History,
  Tags,
  UserCircle,
  CalendarClock,
  Percent,
  Scissors,
  DollarSign,
  Wallet,
  Receipt,
  TrendingUp,
  Crown,
  FileText,
  Activity,
  BarChart3,
  PieChart,
  UserCheck,
  Download,
  Upload,
  FileWarning,
  MessageSquare,
  Send,
  Building,
  Shield,
  Puzzle,
  Settings,
  Video,
  HelpCircle,
  ChevronRight,
  LogOut,
  Image,
  Bell,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "",
    icon: LayoutDashboard,
  },
  {
    title: "Agenda",
    url: "agenda",
    icon: Calendar,
    items: [
      { title: "Agendamentos", url: "bookings", icon: Calendar },
      { title: "Calendario", url: "calendar", icon: CalendarDays },
      { title: "Lista de Espera", url: "waiting-list", icon: Clock },
    ],
  },
  {
    title: "Clientes",
    url: "clients",
    icon: Users,
    items: [
      { title: "Lista de Clientes", url: "clients", icon: Users },
      { title: "Historico", url: "clients/history", icon: History },
      { title: "Tags e Segmentos", url: "clients/tags", icon: Tags },
    ],
  },
  {
    title: "Profissionais",
    url: "professionals",
    icon: UserCircle,
    items: [
      { title: "Equipe", url: "professionals", icon: UserCircle },
      { title: "Disponibilidade", url: "availability", icon: CalendarClock },
      { title: "Comissoes", url: "commissions", icon: Percent },
    ],
  },
  {
    title: "Servicos",
    url: "services",
    icon: Scissors,
    items: [
      { title: "Catalogo", url: "services", icon: Scissors },
      { title: "Precos", url: "services/pricing", icon: DollarSign },
    ],
  },
  {
    title: "Financeiro",
    url: "finance",
    icon: Wallet,
    items: [
      { title: "Visao Geral", url: "finance", icon: Wallet },
      { title: "Transacoes", url: "transactions", icon: Receipt },
      { title: "Fluxo de Caixa", url: "cashflow", icon: TrendingUp },
    ],
  },
  {
    title: "Assinaturas",
    url: "subscriptions",
    icon: Crown,
    items: [
      { title: "Planos", url: "subscriptions", icon: Crown },
      { title: "Faturas", url: "invoices", icon: FileText },
      { title: "Status", url: "subscriptions/status", icon: Activity },
    ],
  },
  {
    title: "Relatorios",
    url: "reports",
    icon: BarChart3,
    items: [
      { title: "Receita", url: "reports/revenue", icon: BarChart3 },
      { title: "Agendamentos", url: "reports/bookings", icon: PieChart },
      { title: "Retencao", url: "reports/retention", icon: UserCheck },
      { title: "Central de Exportacao", url: "reports/export", icon: Download },
    ],
  },
  {
    title: "Importacoes",
    url: "imports",
    icon: Upload,
    items: [
      { title: "Importar Clientes", url: "imports/clients", icon: Upload },
      { title: "Importar Servicos", url: "imports/services", icon: Upload },
      { title: "Importar Profissionais", url: "imports/professionals", icon: Upload },
      { title: "Logs de Importacao", url: "import-logs", icon: FileWarning },
    ],
  },
  {
    title: "Galeria",
    url: "gallery",
    icon: Image,
  },
  {
    title: "Notificacoes",
    url: "notifications",
    icon: Bell,
    items: [
      { title: "Templates", url: "notification-templates", icon: FileText },
      { title: "WhatsApp/Email", url: "notification-settings", icon: MessageSquare },
      { title: "Logs de Envio", url: "notification-logs", icon: Send },
    ],
  },
  {
    title: "Configuracoes",
    url: "settings",
    icon: Settings,
    items: [
      { title: "Perfil da Barbearia", url: "settings", icon: Building },
      { title: "Usuarios e Funcoes", url: "settings/users", icon: Shield },
      { title: "Integracoes", url: "settings/integrations", icon: Puzzle },
      { title: "Preferencias", url: "settings/preferences", icon: Settings },
    ],
  },
  {
    title: "Ajuda",
    url: "help",
    icon: HelpCircle,
    items: [
      { title: "Tutoriais", url: "tutorials", icon: Video },
      { title: "Suporte", url: "support", icon: HelpCircle },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { barbershop, baseUrl } = useBarbershopContext();
  const { user, signOut } = useAuth();
  const { userRole } = useUserRole(barbershop?.id);
  
  const collapsed = state === "collapsed";
  const adminBaseUrl = `${baseUrl}/admin`;
  const currentPath = location.pathname;

  const isActive = (url: string) => {
    const fullUrl = `${adminBaseUrl}${url ? `/${url}` : ""}`;
    if (url === "") {
      return currentPath === adminBaseUrl || currentPath === `${adminBaseUrl}/`;
    }
    return currentPath.startsWith(fullUrl);
  };

  const isGroupActive = (item: NavItem) => {
    if (item.items) {
      return item.items.some((subItem) => isActive(subItem.url));
    }
    return isActive(item.url);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || "U";

  const currentRole = userRole?.[0]?.role || "admin";
  const roleLabel = currentRole === "super_admin" ? "Super Admin" : currentRole === "admin" ? "Administrador" : "Barbeiro";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border p-4">
        <Link to={baseUrl} className="flex items-center gap-3">
          {barbershop?.logo_url ? (
            <img
              src={barbershop.logo_url}
              alt={barbershop.name}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground truncate max-w-[140px]">
                {barbershop?.name || "Barbearia"}
              </span>
              <span className="text-xs text-muted-foreground">Painel Admin</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible defaultOpen={isGroupActive(item)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`w-full justify-between ${
                            isGroupActive(item)
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={`${
                                    isActive(subItem.url)
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted"
                                  }`}
                                >
                                  <Link to={`${adminBaseUrl}/${subItem.url}`}>
                                    <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      className={`${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-sidebar-foreground hover:bg-muted"
                      }`}
                    >
                      <Link to={`${adminBaseUrl}${item.url ? `/${item.url}` : ""}`}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </span>
              <Badge variant="secondary" className="w-fit text-xs">
                {roleLabel}
              </Badge>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AdminSidebar;
