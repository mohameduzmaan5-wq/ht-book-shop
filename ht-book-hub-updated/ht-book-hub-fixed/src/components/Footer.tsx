import { SHOP } from "@/lib/shop";
import { Phone, MessageCircle, Facebook, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-display text-xl">{SHOP.name}</h3>
          <p className="text-sm text-muted-foreground mt-2">{SHOP.city}, Sri Lanka</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {SHOP.address}
          </p>
        </div>
        <div>
          <h4 className="font-display text-base mb-2">Contact</h4>
          <ul className="text-sm space-y-2">
            <li><a className="hover:text-primary flex items-center gap-2" href={`tel:${SHOP.phone}`}><Phone className="w-4 h-4" /> {SHOP.phone}</a></li>
            <li><a className="hover:text-primary flex items-center gap-2" target="_blank" rel="noreferrer" href={`https://wa.me/${SHOP.whatsapp}`}><MessageCircle className="w-4 h-4" /> WhatsApp</a></li>
            <li><a className="hover:text-primary flex items-center gap-2" target="_blank" rel="noreferrer" href={SHOP.facebook}><Facebook className="w-4 h-4" /> Facebook</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base mb-2">Shop</h4>
          <ul className="text-sm space-y-2">
            <li><a href="/books" className="hover:text-primary">All Books</a></li>
            <li><a href="/categories" className="hover:text-primary">Categories</a></li>
            <li><a href="/orders" className="hover:text-primary">My Orders</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base mb-2">Find us</h4>
          <iframe src={SHOP.mapsEmbed} className="w-full h-32 rounded-md border border-border" loading="lazy" />
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
        © {new Date().getFullYear()} {SHOP.name}. All rights reserved.
      </div>
    </footer>
  );
}
