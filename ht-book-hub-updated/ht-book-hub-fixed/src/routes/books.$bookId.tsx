import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatLKR } from "@/lib/shop";
import { Heart, ShoppingCart, BookOpen } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/books/$bookId")({
  component: BookDetail,
});

function BookDetail() {
  const { bookId } = Route.useParams();
  const cart = useCart();
  const wl = useWishlist();
  const { t } = useI18n();

  const { data: book, isLoading, refetch } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books")
        .select("*, publications(name)")
        .eq("id", bookId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Realtime stock updates
  useEffect(() => {
    const ch = supabase.channel(`book-${bookId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "books", filter: `id=eq.${bookId}` },
        () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookId, refetch]);

  if (isLoading) return <div className="container mx-auto p-10 text-muted-foreground">Loading…</div>;
  if (!book) return <div className="container mx-auto p-10">Book not found. <Link to="/books" className="text-primary">Back</Link></div>;

  const inStock = book.stock > 0;
  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div className="aspect-[3/4] rounded-2xl book-cover overflow-hidden max-w-md w-full mx-auto animate-book-open">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-primary-foreground">
            <BookOpen className="w-16 h-16 mb-4 opacity-70" />
            <div className="font-display text-2xl">{book.name}</div>
          </div>
        )}
      </div>
      <div>
        <Badge variant={inStock ? "default" : "destructive"} className="mb-3">
          {inStock ? `${t("inStock")} · ${book.stock} left` : t("outOfStock")}
        </Badge>
        <h1 className="font-display text-4xl">{book.name}</h1>
        <p className="text-muted-foreground mt-2">by <span className="text-foreground">{book.author}</span></p>
        <div className="mt-3 text-sm text-muted-foreground">
          {book.publications?.name ? `${book.publications.name} · ` : ""}{book.grade}
          {book.category ? ` · ${book.category}` : ""}
        </div>
        <div className="mt-6 text-4xl font-display gold-text">{formatLKR(Number(book.price))}</div>
        {book.description && (
          <p className="mt-6 leading-relaxed text-foreground/90 whitespace-pre-line">{book.description}</p>
        )}

        <div className="mt-8 flex gap-3">
          <Button size="lg" disabled={!inStock} onClick={() => cart.add({
            id: book.id, name: book.name, price: Number(book.price),
            cover_url: book.cover_url, weight_grams: book.weight_grams, stock: book.stock,
          })}>
            <ShoppingCart className="w-4 h-4 mr-2" />{t("addToCart")}
          </Button>
          <Button size="lg" variant="outline" onClick={() => wl.toggle(book.id)}>
            <Heart className={`w-4 h-4 mr-2 ${wl.has(book.id) ? "fill-destructive text-destructive" : ""}`} />
            {t("wishlist")}
          </Button>
        </div>
      </div>
    </div>
  );
}
