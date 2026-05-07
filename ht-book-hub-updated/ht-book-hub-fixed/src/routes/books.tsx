import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GRADES } from "@/lib/shop";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  grade: z.string().optional(),
  pub: z.string().optional(),
});

export const Route = createFileRoute("/books")({
  validateSearch: (s) => searchSchema.parse(s),
  component: BooksPage,
});

function BooksPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [grade, setGrade] = useState(search.grade ?? "all");
  const [pub, setPub] = useState(search.pub ?? "all");

  const { data: pubs } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => (await supabase.from("publications").select("id,name").order("name")).data ?? [],
  });

  const { data: books, isLoading } = useQuery({
    queryKey: ["books", q, grade, pub],
    queryFn: async () => {
      let query = supabase.from("books")
        .select("id,name,author,price,stock,cover_url,weight_grams,grade,publication_id");
      if (grade !== "all") query = query.eq("grade", grade);
      if (pub !== "all") query = query.eq("publication_id", pub);
      if (q) query = query.or(`name.ilike.%${q}%,author.ilike.%${q}%`);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-6">All Books</h1>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Input placeholder="Search title or author..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={pub} onValueChange={setPub}>
          <SelectTrigger><SelectValue placeholder="Publication" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All publications</SelectItem>
            {pubs?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : !books?.length ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No books match your filters. <Link to="/books" className="text-primary hover:underline">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}
