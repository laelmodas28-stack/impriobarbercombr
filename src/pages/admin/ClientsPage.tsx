import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Upload, Phone, Mail, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  bookings_count: number;
  last_booking: string | null;
}

export function ClientsPage() {
  const { barbershop, baseUrl } = useBarbershopContext();
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      
      // Get clients with their profiles
      const { data: clientsData, error: clientsError } = await supabase
        .from("barbershop_clients")
        .select(`
          id,
          user_id,
          created_at,
          profile:profiles(full_name, email, phone, avatar_url)
        `)
        .eq("barbershop_id", barbershop.id);
      
      if (clientsError) throw clientsError;

      // Get bookings count for each client
      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id, booking_date")
            .eq("barbershop_id", barbershop.id)
            .eq("client_id", client.user_id)
            .order("booking_date", { ascending: false });
          
          return {
            ...client,
            profile: Array.isArray(client.profile) ? client.profile[0] : client.profile,
            bookings_count: bookings?.length || 0,
            last_booking: bookings?.[0]?.booking_date || null,
          };
        })
      );

      return clientsWithStats as Client[];
    },
    enabled: !!barbershop?.id,
  });

  const columns: Column<Client>[] = [
    {
      key: "profile",
      header: "Cliente",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={item.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {item.profile?.full_name?.charAt(0)?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {item.profile?.full_name || "Cliente sem nome"}
            </p>
            {item.profile?.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {item.profile.email}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      cell: (item) => (
        <div className="flex items-center gap-2 text-sm">
          {item.profile?.phone ? (
            <>
              <Phone className="h-4 w-4 text-muted-foreground" />
              {item.profile.phone}
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: "bookings_count",
      header: "Agendamentos",
      sortable: true,
      cell: (item) => (
        <Badge variant="secondary" className="font-medium">
          {item.bookings_count}
        </Badge>
      ),
    },
    {
      key: "last_booking",
      header: "Ultimo Agendamento",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2 text-sm">
          {item.last_booking ? (
            <>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(parseISO(item.last_booking), "dd/MM/yyyy", { locale: ptBR })}
            </>
          ) : (
            <span className="text-muted-foreground">Nunca agendou</span>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Cliente desde",
      sortable: true,
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="gap-2">
              <a href={`${baseUrl}/admin/imports/clients`}>
                <Upload className="h-4 w-4" />
                Importar
              </a>
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        }
      />

      <DataTable
        data={clients}
        columns={columns}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Buscar por nome, email ou telefone..."
        searchKeys={["profile.full_name", "profile.email", "profile.phone"]}
        pageSize={10}
        onRowClick={(client) => navigate(`${baseUrl}/admin/clients/${client.id}`)}
        emptyState={{
          icon: Users,
          title: "Nenhum cliente cadastrado",
          description: "Comece importando seus clientes ou eles serao adicionados automaticamente ao agendar.",
          action: {
            label: "Importar Clientes",
            onClick: () => navigate(`${baseUrl}/admin/imports/clients`),
            icon: Upload,
          },
        }}
      />
    </div>
  );
}

export default ClientsPage;
