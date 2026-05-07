import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  cover_url: string | null;
  weight_grams: number;
  stock: number;
};

type Ctx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  totalWeight: number;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const add: Ctx["add"] = (i) => {
    setItems((cur) => {
      const existing = cur.find((c) => c.id === i.id);
      if (existing) {
        return cur.map((c) => c.id === i.id ? { ...c, qty: Math.min(c.qty + (i.qty ?? 1), i.stock) } : c);
      }
      return [...cur, { ...i, qty: i.qty ?? 1 }];
    });
    toast.success(`Added "${i.name}" to cart`);
  };

  const remove = (id: string) => setItems((c) => c.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((c) => c.map((i) => i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i));
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalWeight = items.reduce((s, i) => s + i.weight_grams * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, subtotal, totalWeight, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
