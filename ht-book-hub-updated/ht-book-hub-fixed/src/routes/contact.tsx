import { createFileRoute } from "@tanstack/react-router";
import { SHOP } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Facebook, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display text-4xl">Contact us</h1>
        <p className="text-muted-foreground mt-3">{SHOP.name}, {SHOP.address}</p>
        <div className="mt-8 space-y-3">
          <a href={`tel:${SHOP.phone}`}><Button size="lg" className="w-full justify-start"><Phone className="w-4 h-4 mr-3" /> {SHOP.phone}</Button></a>
          <a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="w-full justify-start"><MessageCircle className="w-4 h-4 mr-3" /> Chat on WhatsApp</Button>
          </a>
          <a href={SHOP.facebook} target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="w-full justify-start"><Facebook className="w-4 h-4 mr-3" /> Facebook page</Button>
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${SHOP.mapsQuery}`} target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="w-full justify-start"><MapPin className="w-4 h-4 mr-3" /> Open in Google Maps</Button>
          </a>
        </div>
      </div>
      <div>
        <iframe src={SHOP.mapsEmbed} className="w-full h-96 rounded-xl border border-border" loading="lazy" />
      </div>
    </div>
  );
}
