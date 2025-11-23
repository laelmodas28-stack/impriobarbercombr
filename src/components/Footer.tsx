import { Link } from "react-router-dom";
import { Crown } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-primary" />
              <span className="font-bold text-lg">IMPÉRIO BARBER</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Barbearia premium com atendimento de excelência
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                Serviços
              </Link>
              <Link to="/professionals" className="text-muted-foreground hover:text-primary transition-colors">
                Profissionais
              </Link>
              <Link to="/booking" className="text-muted-foreground hover:text-primary transition-colors">
                Agendar
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                Sobre Nós
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Horários</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Segunda a Sexta: 08:00 - 19:00</p>
              <p>Sábado: 08:00 - 17:00</p>
              <p>Domingo: Fechado</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} IMPÉRIO BARBER. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
