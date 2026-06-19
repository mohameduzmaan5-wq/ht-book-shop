import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const WishlistContext = createContext<{
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
} | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { const raw = localStorage.getItem("wishlist"); if (raw) setIds(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("wishlist", JSON.stringify(ids));
  }, [ids]);

  const toggle = (id: string) =>
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const has = (id: string) => ids.includes(id);

  return <WishlistContext.Provider value={{ ids, toggle, has }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
