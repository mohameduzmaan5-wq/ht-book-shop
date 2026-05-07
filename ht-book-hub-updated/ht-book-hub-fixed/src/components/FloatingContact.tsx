import { SHOP } from "@/lib/shop";
import { Phone, MessageCircle } from "lucide-react";

export function FloatingContact() {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noreferrer"
        className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
      <a
        href={`tel:${SHOP.phone}`}
        className="w-12 h-12 rounded-full hero-bg text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Call"
      >
        <Phone className="w-5 h-5" />
      </a>
    </div>
  );
}
