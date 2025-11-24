import { FaWhatsapp, FaInstagram, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  className?: string;
}

export const SocialLinks = ({ whatsapp, instagram, tiktok, className = "" }: SocialLinksProps) => {
  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleInstagram = () => {
    if (instagram) {
      const username = instagram.replace('@', '');
      window.open(`https://instagram.com/${username}`, '_blank');
    }
  };

  const handleTikTok = () => {
    if (tiktok) {
      const username = tiktok.replace('@', '');
      window.open(`https://tiktok.com/@${username}`, '_blank');
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {whatsapp && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleWhatsApp}
          className="hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <FaWhatsapp className="h-5 w-5" />
        </Button>
      )}
      {instagram && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleInstagram}
          className="hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <FaInstagram className="h-5 w-5" />
        </Button>
      )}
      {tiktok && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleTikTok}
          className="hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <FaTiktok className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
