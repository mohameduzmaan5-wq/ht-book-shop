import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLKR, SHOP } from "@/lib/shop";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/orders")({ component: Orders });

const CANCEL_WINDOW_MS = 20 * 60 * 1000; // 20 minutes

function useCountdown(createdAt: string) {
  const getRemaining = () => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, CANCEL_WINDOW_MS - elapsed);
  };
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  return remaining;
}

function CancelButton({ order, onCancelled }: { order: any; onCancelled: () => void }) {
  const remaining = useCountdown(order.created_at);
  const [loading, setLoading] = useState(false);

  if (order.status !== "pending") return null;

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  if (remaining <= 0) {
    return (
      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
        <XCircle className="w-3 h-3" />
        Cancellation window expired.{" "}
        <a
          href={`https://wa.me/${SHOP.whatsapp}?text=Hi, I want to cancel order %23${order.id.slice(0, 8)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Contact us on WhatsApp to cancel
        </a>
      </div>
    );
  }

  const cancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoading(true);
    for (const item of order.order_items) {
      const { data: book } = await supabase.from("books").select("stock").eq("id", item.book_id).single();
      if (book) {
        await supabase.from("books").update({ stock: book.stock + item.qty }).eq("id", item.book_id);
      }
    }
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order cancelled. Stock has been restored.");
    onCancelled();
  };

  return (
    <div className="mt-3 flex items-center gap-3 flex-wrap">
      <Button variant="destructive" size="sm" onClick={cancel} disabled={loading}>
        {loading ? "Cancelling…" : "Cancel Order"}
      </Button>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Cancel available for:{" "}
        <span className="font-mono font-semibold text-foreground">{mm}:{ss}</span>
      </span>
    </div>
  );
}

function Orders() {
  const { user, loading } = useAuth();
  const { data: orders, refetch } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  if (loading) return <div className="container mx-auto p-10">Loading…</div>;
  if (!user) return <div className="container mx-auto p-10">Please <Link to="/auth" className="text-primary">sign in</Link>.</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-6">My Orders</h1>
      {!orders?.length ? (
        <div className="text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</div>
                  <div className="text-sm">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <Badge variant={o.status === "cancelled" ? "destructive" : "default"}>{o.status}</Badge>
              </div>
              <div className="mt-3 text-sm">
                {o.order_items.map((it: any) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.name} × {it.qty}</span>
                    <span>{formatLKR(Number(it.price) * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between font-display text-lg pt-3 border-t border-border">
                <span>Total</span><span>{formatLKR(Number(o.total))}</span>
              </div>
              {o.tracking_number && (
                <div className="mt-3 text-sm">
                  Courier: <strong>{o.courier ?? "—"}</strong> · Tracking: <span className="font-mono">{o.tracking_number}</span>
                </div>
              )}
              <CancelButton order={o} onCancelled={refetch} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
