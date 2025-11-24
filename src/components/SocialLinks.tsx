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
      window.open(`https://wa.me/${cleanNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInstagram = () => {
    if (instagram) {
      const username = instagram.replace('@', '').trim();
      window.open(`https://instagram.com/${username}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTikTok = () => {
    if (tiktok) {
      const username = tiktok.replace('@', '').trim();
      window.open(`https://tiktok.com/@${username}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {whatsapp && (
        <Button
          variant="default"
          size="lg"
          onClick={handleWhatsApp}
          className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
        >
          <FaWhatsapp className="h-5 w-5" />
          <span>WhatsApp</span>
        </Button>
      )}
      {instagram && (
        <Button
          variant="default"
          size="lg"
          onClick={handleInstagram}
          className="flex-1 gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white"
        >
          <FaInstagram className="h-5 w-5" />
          <span>Instagram</span>
        </Button>
      )}
      {tiktok && (
        <Button
          variant="default"
          size="lg"
          onClick={handleTikTok}
          className="flex-1 gap-2 bg-black hover:bg-gray-800 text-white"
        >
          <FaTiktok className="h-5 w-5" />
          <span>TikTok</span>
        </Button>
      )}
    </div>
  );
};
