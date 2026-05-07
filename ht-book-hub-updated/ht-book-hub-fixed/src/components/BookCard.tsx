import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, BookOpen } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";
import { formatLKR } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Book = {
  id: string;
  name: string;
  author: string;
  price: number;
  stock: number;
  cover_url: string | null;
  weight_grams: number;
  grade: string;
};

export function BookCard({ book }: { book: Book }) {
  const cart = useCart();
  const wl = useWishlist();
  const { t } = useI18n();
  const inStock = book.stock > 0;

  return (
    <div className="book-card group bg-card rounded-xl overflow-hidden border border-border flex flex-col">
      <Link
        to="/books/$bookId"
        params={{ bookId: book.id }}
        className="relative block aspect-[3/4] book-cover"
      >
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.name} loading="lazy"
               className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="w-10 h-10 mb-2 opacity-60" />
            <div className="font-display text-lg leading-tight line-clamp-3">{book.name}</div>
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); wl.toggle(book.id); }}
          className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background"
          aria-label="wishlist"
        >
          <Heart className={`w-4 h-4 ${wl.has(book.id) ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
        <Badge className="absolute bottom-2 left-2" variant={inStock ? "default" : "destructive"}>
          {inStock ? t("inStock") : t("outOfStock")}
        </Badge>
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-xs text-muted-foreground">{book.grade}</div>
        <Link to="/books/$bookId" params={{ bookId: book.id }} className="font-display text-base leading-tight line-clamp-2 hover:text-primary">
          {book.name}
        </Link>
        <div className="text-xs text-muted-foreground line-clamp-1">by {book.author}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="font-semibold gold-text text-lg">{formatLKR(book.price)}</div>
          <Button
            size="sm"
            disabled={!inStock}
            onClick={() => cart.add({
              id: book.id, name: book.name, price: book.price,
              cover_url: book.cover_url, weight_grams: book.weight_grams, stock: book.stock,
            })}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
