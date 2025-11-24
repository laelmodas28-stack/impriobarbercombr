import { FaWhatsapp, FaInstagram, FaTiktok } from "react-icons/fa";

interface SocialLinksProps {
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  className?: string;
}

export const SocialLinks = ({ whatsapp, instagram, tiktok, className = "" }: SocialLinksProps) => {
  const getWhatsAppLink = () => {
    if (!whatsapp) return "#";
    const cleanNumber = whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  const getInstagramLink = () => {
    if (!instagram) return "#";
    const username = instagram.replace('@', '').trim();
    return `https://instagram.com/${username}`;
  };

  const getTikTokLink = () => {
    if (!tiktok) return "#";
    const username = tiktok.replace('@', '').trim();
    return `https://tiktok.com/@${username}`;
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {whatsapp && (
        <a 
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-11 px-8 bg-[#25D366] hover:bg-[#20BD5A] text-white transition-colors"
        >
          <FaWhatsapp className="h-5 w-5" />
          <span>WhatsApp</span>
        </a>
      )}
      {instagram && (
        <a 
          href={getInstagramLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-11 px-8 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white transition-opacity"
        >
          <FaInstagram className="h-5 w-5" />
          <span>Instagram</span>
        </a>
      )}
      {tiktok && (
        <a 
          href={getTikTokLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-11 px-8 bg-black hover:bg-gray-800 text-white transition-colors"
        >
          <FaTiktok className="h-5 w-5" />
          <span>TikTok</span>
        </a>
      )}
    </div>
  );
};
