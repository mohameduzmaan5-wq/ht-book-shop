import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { BookOpen, Layers } from "lucide-react";

export const Route = createFileRoute("/categories")({
  component: Categories,
});

function Categories() {
  const { t } = useI18n();
  const { data: pubs } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => (await supabase.from("publications").select("id,name").order("name")).data ?? [],
  });

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      <section>
        <h1 className="font-display text-3xl mb-6 flex items-center gap-3"><Layers className="w-7 h-7 text-primary" />{t("byGrade")}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {GRADES.map((g) => (
            <Link key={g} to="/books" search={{ grade: g } as any}
                  className="book-card bg-card border border-border rounded-xl p-5 text-center hover:bg-accent transition-colors">
              <div className="font-display text-lg">{g}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6 flex items-center gap-3"><BookOpen className="w-7 h-7 text-primary" />{t("byPublication")}</h2>
        {!pubs?.length ? (
          <div className="text-muted-foreground">No publications yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pubs.map((p) => (
              <Link key={p.id} to="/books" search={{ pub: p.id } as any}
                    className="book-card bg-card border border-border rounded-xl p-6 hero-bg text-primary-foreground">
                <div className="font-display text-xl">{p.name}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
