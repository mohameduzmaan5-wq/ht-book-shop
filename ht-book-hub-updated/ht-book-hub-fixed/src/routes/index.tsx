import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { GRADES } from "@/lib/shop";
import { ArrowRight, BookOpen, Sparkles, Truck } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data: featured } = useQuery({
    queryKey: ["books", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,name,author,price,stock,cover_url,weight_grams,grade,is_featured,created_at")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="hero-bg absolute inset-0 opacity-95" />
        <img src={logo} alt="" aria-hidden="true" className="logo-watermark" />
        <div className="relative container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center text-primary-foreground">
          <div className="animate-float-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs uppercase tracking-widest mb-5">
              <Sparkles className="w-3 h-3" /> Horowapothana's premium bookstore
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-tight">
              {t("heroTitle").split(" ").slice(0, -2).join(" ")}{" "}
              <span className="gold-text">{t("heroTitle").split(" ").slice(-2).join(" ")}</span>
            </h1>
            <p className="mt-5 text-lg opacity-90 max-w-lg">{t("heroSub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/books"><Button size="lg" className="bg-white text-primary hover:bg-white/90">{t("shopNow")} <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link to="/categories"><Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10">{t("categories")}</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md text-sm">
              <div className="flex items-start gap-2"><Truck className="w-4 h-4 mt-1 opacity-90" /><span>Island-wide delivery</span></div>
              <div className="flex items-start gap-2"><BookOpen className="w-4 h-4 mt-1 opacity-90" /><span>All grades 1 → A/L</span></div>
              <div className="flex items-start gap-2"><Sparkles className="w-4 h-4 mt-1 opacity-90" /><span>Live courier tracking</span></div>
            </div>
          </div>

          {/* Realistic 3D book with flipping multilingual quote pages */}
          <div className="flex items-center justify-center">
            <div className="book3d-stage">
              <div className="book3d">
                <div className="book3d__back" />
                <div className="book3d__pages" />
                <div className="book3d__cover">
                  <div className="book3d__title">
                    <div className="text-xs tracking-[0.3em] opacity-70 mb-2">HT BOOK SHOP</div>
                    <div className="quote-stack absolute inset-4 left-8">
                      <div className="quote-card text-base md:text-lg italic">
                        "A reader lives a thousand lives before he dies."
                      </div>
                      <div className="quote-card text-base md:text-lg italic" style={{ fontFamily: "var(--font-serif)" }}>
                        "படிக்கும் மனிதன் ஆயிரம் வாழ்க்கை வாழ்கிறான்."
                      </div>
                      <div className="quote-card text-base md:text-lg italic">
                        "කියවන්නා දහස් ගණනක් ජීවිත ජීවත් වෙයි."
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl">{t("featured")}</h2>
          <Link to="/books" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {!featured || featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No books yet. {" "}
            <Link to="/admin" className="text-primary hover:underline">Add some in the admin dashboard</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {featured.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </section>

      {/* GRADES */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display text-3xl mb-6">{t("byGrade")}</h2>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <Link key={g} to="/books" search={{ grade: g } as any}
                  className="px-4 py-2 rounded-full bg-card border border-border hover:bg-accent transition-colors text-sm">
              {g}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
