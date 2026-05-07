import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/lib/wishlist";
import { BookCard } from "@/components/BookCard";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const wl = useWishlist();
  const { t } = useI18n();
  const { data: books } = useQuery({
    queryKey: ["wishlist", wl.ids.join(",")],
    queryFn: async () => {
      if (!wl.ids.length) return [];
      const { data } = await supabase.from("books")
        .select("id,name,author,price,stock,cover_url,weight_grams,grade")
        .in("id", wl.ids);
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-6">{t("wishlist")}</h1>
      {!books?.length ? (
        <div className="text-muted-foreground">{t("empty")} <Link to="/books" className="text-primary">Find books</Link></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}
