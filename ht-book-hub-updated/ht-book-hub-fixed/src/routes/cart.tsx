import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { formatLKR } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const cart = useCart();
  const { t } = useI18n();

  if (!cart.items.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl">{t("cart")}</h1>
        <p className="text-muted-foreground mt-2">{t("empty")}</p>
        <Link to="/books"><Button className="mt-6">Browse books</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-3">
        <h1 className="font-display text-3xl mb-3">{t("cart")}</h1>
        {cart.items.map((i) => (
          <div key={i.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
            <div className="w-20 h-28 rounded-md book-cover overflow-hidden flex-shrink-0">
              {i.cover_url && <img src={i.cover_url} alt={i.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg">{i.name}</div>
              <div className="text-sm text-muted-foreground">{formatLKR(i.price)}</div>
              <div className="mt-3 flex items-center gap-2">
                <Input type="number" min={1} max={i.stock} value={i.qty}
                       onChange={(e) => cart.setQty(i.id, parseInt(e.target.value || "1"))}
                       className="w-20" />
                <Button variant="ghost" size="icon" onClick={() => cart.remove(i.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="text-right font-semibold">{formatLKR(i.price * i.qty)}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-24">
        <h3 className="font-display text-xl mb-4">Summary</h3>
        <div className="flex justify-between text-sm mb-2"><span>{t("subtotal")}</span><span>{formatLKR(cart.subtotal)}</span></div>
        <div className="flex justify-between text-sm mb-2 text-muted-foreground"><span>{t("delivery")}</span><span>calculated at checkout</span></div>
        <div className="flex justify-between font-display text-lg mt-4 pt-4 border-t border-border"><span>{t("total")}</span><span>{formatLKR(cart.subtotal)}</span></div>
        <Link to="/checkout"><Button className="w-full mt-5" size="lg">{t("checkout")}</Button></Link>
      </div>
    </div>
  );
}
