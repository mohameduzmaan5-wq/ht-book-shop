import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRICTS, formatLKR } from "@/lib/shop";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/checkout")({ component: Checkout });

const orderSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(500),
  district: z.string().min(1),
  notes: z.string().max(500).optional(),
});

function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", phone: "", address: "", district: "Anuradhapura", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.info("Please sign in to checkout");
      nav({ to: "/auth", search: { redirect: "/checkout" } as any });
    }
  }, [user, nav]);

  const { data: rates } = useQuery({
    queryKey: ["rates"],
    queryFn: async () => (await supabase.from("delivery_rates").select("*")).data ?? [],
  });

  const rate = useMemo(() => rates?.find((r) => r.district === form.district), [rates, form.district]);
  const kg = cart.totalWeight / 1000;
  const deliveryFee = rate ? Number(rate.base_fee) + Number(rate.per_kg) * Math.max(kg, 0.5) : 0;
  const total = cart.subtotal + deliveryFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!cart.items.length) return;
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        district: form.district,
        subtotal: cart.subtotal,
        delivery_fee: Math.round(deliveryFee),
        total: Math.round(total),
        total_weight_grams: cart.totalWeight,
        notes: form.notes || null,
        payment_method: "cod",
      }).select().single();
      if (error) throw error;

      const items = cart.items.map((i) => ({
        order_id: order.id, book_id: i.id, name: i.name, price: i.price, qty: i.qty,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      cart.clear();
      toast.success("Order placed! We'll be in touch shortly.");
      nav({ to: "/orders" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
      <form onSubmit={submit} className="md:col-span-2 space-y-4 bg-card border border-border rounded-xl p-6">
        <h1 className="font-display text-3xl mb-2">Checkout</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
        </div>
        <div><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
        <div>
          <Label>District</Label>
          <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="text-sm text-muted-foreground">Payment: <strong>Cash on delivery</strong></div>
        <Button type="submit" disabled={submitting || !cart.items.length} size="lg" className="w-full">
          {submitting ? "Placing…" : `Place order — ${formatLKR(total)}`}
        </Button>
      </form>

      <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-24">
        <h3 className="font-display text-xl mb-4">Order summary</h3>
        {cart.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm mb-2">
            <span className="line-clamp-1">{i.name} × {i.qty}</span>
            <span>{formatLKR(i.price * i.qty)}</span>
          </div>
        ))}
        <hr className="my-3 border-border" />
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatLKR(cart.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Delivery ({form.district}, {kg.toFixed(1)} kg)</span><span>{formatLKR(deliveryFee)}</span></div>
        <div className="flex justify-between font-display text-lg mt-3 pt-3 border-t border-border"><span>Total</span><span>{formatLKR(total)}</span></div>
      </div>
    </div>
  );
}
