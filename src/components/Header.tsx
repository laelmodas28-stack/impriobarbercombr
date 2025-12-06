import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, LogOut, User } from "lucide-react";
import imperioLogo from "@/assets/imperio-logo.webp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";

const Header = () => {
  const { user, signOut } = useAuth();
  const { barbershop: barbershopInfo, baseUrl } = useBarbershopContext();
  const location = useLocation();
  const params = useParams<{ slug?: string }>();

  // Verificar se estamos em uma rota /b/:slug usando o params diretamente
  const isInBarbershopRoute = !!params.slug && location.pathname.startsWith("/b/");

  // Usar baseUrl para links se estiver em rota de barbearia
  const getLink = (path: string) => {
    if (isInBarbershopRoute && baseUrl) {
      return `${baseUrl}${path}`;
    }
    return path;
  };

  const homeLink = isInBarbershopRoute && baseUrl ? baseUrl : "/";

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={homeLink} className="flex items-center gap-3 group">
          <img 
            src={barbershopInfo?.logo_url || imperioLogo} 
            alt={barbershopInfo?.name || "IMPÉRIO BARBER"} 
            className="w-12 h-12 transition-transform group-hover:scale-110 object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="text-primary w-5 h-5" />
              {barbershopInfo?.name || "IMPÉRIO BARBER"}
            </h1>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to={getLink("/booking")}>
                <Button variant="premium" size="lg">
                  Agendar
                </Button>
              </Link>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/account">Minha Conta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="premium" size="lg">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
