import { Link, useParams } from "react-router-dom";
import { Crown } from "lucide-react";
import { SocialLinks } from "./SocialLinks";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";

const Footer = () => {
  const { barbershop: info, baseUrl } = useBarbershopContext();

  return <footer className="border-t border-border bg-card/50 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-primary" />
              <span className="font-bold text-lg">{info?.name || "Barbearia"}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {info?.mensagem_personalizada || "Barbearia premium com atendimento de excelência"}
            </p>
            <SocialLinks whatsapp={info?.whatsapp} instagram={info?.instagram} tiktok={info?.tiktok} />
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to={`${baseUrl}/services`} className="text-muted-foreground hover:text-primary transition-colors">
                Serviços
              </Link>
              <Link to={`${baseUrl}/professionals`} className="text-muted-foreground hover:text-primary transition-colors">
                Profissionais
              </Link>
              <Link to={`${baseUrl}/booking`} className="text-muted-foreground hover:text-primary transition-colors">
                Agendar
              </Link>
              <Link to={`${baseUrl}/about`} className="text-muted-foreground hover:text-primary transition-colors">
                Sobre Nós
              </Link>
            </div>
          </div>
          
          
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {info?.name || "Barbearia"}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;