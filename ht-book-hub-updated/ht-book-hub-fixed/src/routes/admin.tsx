import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GRADES, formatLKR } from "@/lib/shop";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Plus, AlertTriangle, TrendingUp, ShoppingBag, BookOpen, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="container mx-auto p-10">Loading…</div>;
  if (!user) return <div className="container mx-auto p-10">Please <Link to="/auth" className="text-primary">sign in</Link>.</div>;
  if (!isAdmin) return <NotAdmin userId={user.id} />;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your bookstore</p>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="books"><BooksAdmin /></TabsContent>
        <TabsContent value="orders"><OrdersAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function NotAdmin({ userId }: { userId: string }) {
  const promote = async () => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) toast.error("Could not self-promote: " + error.message);
    else { toast.success("You are now admin. Reloading…"); setTimeout(() => location.reload(), 800); }
  };
  return (
    <div className="container mx-auto p-10 max-w-lg text-center">
      <h1 className="font-display text-3xl mb-4">Admin access required</h1>
      <p className="text-muted-foreground mb-6">
        Click below to make yourself the first admin of HT Book Shop. After that, only existing admins can grant the role.
      </p>
      <Button onClick={promote}>Make me admin (first-time setup)</Button>
    </div>
  );
}

function Overview() {
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: books } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => (await supabase.from("books").select("id,name,stock,price")).data ?? [],
  });

  const stats = useMemo(() => {
    if (!orders) return null;
    // Exclude cancelled orders from all stats
    const active = orders.filter((o: any) => o.status !== "cancelled");
    const total = active.reduce((s, o: any) => s + Number(o.total), 0);
    const now = Date.now();
    const day = active.filter((o: any) => now - new Date(o.created_at).getTime() < 86400000);
    const week = active.filter((o: any) => now - new Date(o.created_at).getTime() < 7 * 86400000);
    const month = active.filter((o: any) => now - new Date(o.created_at).getTime() < 30 * 86400000);
    const counts = new Map<string, { name: string; qty: number }>();
    active.forEach((o: any) => o.order_items.forEach((it: any) => {
      const c = counts.get(it.book_id) ?? { name: it.name, qty: 0 };
      c.qty += it.qty; counts.set(it.book_id, c);
    }));
    const best = [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { total, count: active.length, day, week, month, best };
  }, [orders]);

  const lowStock = books?.filter((b) => b.stock <= 5) ?? [];
  const pending = orders?.filter((o: any) => ["pending", "confirmed", "shipped"].includes(o.status)) ?? [];

  return (
    <div className="space-y-6 mt-6">
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag />} label="Total orders" value={stats?.count ?? 0} />
        <StatCard icon={<TrendingUp />} label="Total sales" value={formatLKR(stats?.total ?? 0)} />
        <StatCard icon={<BookOpen />} label="Books in catalog" value={books?.length ?? 0} />
        <StatCard icon={<AlertTriangle />} label="Low stock" value={lowStock.length} highlight={lowStock.length > 0} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Today">{stats?.day.length ?? 0} orders · {formatLKR((stats?.day ?? []).reduce((s: number, o: any) => s + Number(o.total), 0))}</Card>
        <Card title="This week">{stats?.week.length ?? 0} orders · {formatLKR((stats?.week ?? []).reduce((s: number, o: any) => s + Number(o.total), 0))}</Card>
        <Card title="This month">{stats?.month.length ?? 0} orders · {formatLKR((stats?.month ?? []).reduce((s: number, o: any) => s + Number(o.total), 0))}</Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg mb-3">Best sellers</h3>
          {stats?.best.length ? (
            <ul className="space-y-2 text-sm">{stats.best.map((b, i) => <li key={i} className="flex justify-between"><span>{b.name}</span><span className="text-muted-foreground">{b.qty} sold</span></li>)}</ul>
          ) : <div className="text-muted-foreground text-sm">No sales yet.</div>}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg mb-3">Low stock alerts</h3>
          {lowStock.length ? (
            <ul className="space-y-2 text-sm">{lowStock.map((b) => <li key={b.id} className="flex justify-between"><span>{b.name}</span><Badge variant="destructive">{b.stock} left</Badge></li>)}</ul>
          ) : <div className="text-muted-foreground text-sm">All good.</div>}
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-lg mb-3">Pending deliveries ({pending.length})</h3>
        {pending.length ? (
          <ul className="text-sm space-y-1">{pending.slice(0, 10).map((o: any) => <li key={o.id} className="flex justify-between"><span>#{o.id.slice(0, 8)} · {o.full_name}</span><Badge>{o.status}</Badge></li>)}</ul>
        ) : <div className="text-muted-foreground text-sm">Nothing pending.</div>}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: any) {
  return (
    <div className={`bg-card border rounded-xl p-5 ${highlight ? "border-destructive" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}<span>{label}</span></div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}
function Card({ title, children }: any) {
  return <div className="bg-card border border-border rounded-xl p-5"><div className="text-sm text-muted-foreground">{title}</div><div className="font-display text-xl mt-1">{children}</div></div>;
}

function BooksAdmin() {
  const { data: books, refetch } = useQuery({
    queryKey: ["admin-books-full"],
    queryFn: async () => (await supabase.from("books").select("*, publications(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: pubs } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => (await supabase.from("publications").select("id,name").order("name")).data ?? [],
  });

  const empty = { name: "", author: "", publication_id: "", grade: "Grade 1", category: "", price: 0, stock: 0, weight_grams: 500, description: "", cover_url: "", is_featured: false };
  const [form, setForm] = useState<any>(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm({ ...form, cover_url: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let cover_url = form.cover_url;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("book-covers").upload(path, imageFile, { upsert: true });
      if (upErr) { toast.error("Image upload failed: " + upErr.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(path);
      cover_url = urlData.publicUrl;
    }

    const payload = { ...form, cover_url, price: Number(form.price), stock: Number(form.stock), weight_grams: Number(form.weight_grams), publication_id: form.publication_id || null };
    const { error } = await supabase.from("books").insert(payload);
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Book added!");
    setForm(empty); clearImage(); refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); refetch();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <form onSubmit={save} className="bg-card border border-border rounded-xl p-5 space-y-3 h-fit">
        <h3 className="font-display text-xl flex items-center gap-2"><Plus className="w-5 h-5" />Add book</h3>
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Grade</Label>
            <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Publication</Label>
            <Select value={form.publication_id || "none"} onValueChange={(v) => setForm({ ...form, publication_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {pubs?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Price (LKR)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></div>
          <div><Label>Weight (g)</Label><Input type="number" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} /></div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <Label>Cover Image</Label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          {imagePreview ? (
            <div className="relative mt-2 w-32 h-44">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border border-border" />
              <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · Max 2MB</p>
            </div>
          )}
        </div>

        <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Tamil, Sinhala, Novel" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" className="w-full" disabled={uploading}>
          {uploading ? "Uploading…" : "Add book"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-display text-xl">Catalog ({books?.length ?? 0})</h3>
        {books?.map((b: any) => (
          <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
            <div className="w-14 h-20 book-cover rounded overflow-hidden flex-shrink-0">
              {b.cover_url && <img src={b.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium line-clamp-1">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.author} · {b.grade} · {b.publications?.name ?? "—"}</div>
              <div className="text-sm mt-1">{formatLKR(Number(b.price))} · <span className={b.stock <= 5 ? "text-destructive" : ""}>{b.stock} in stock</span></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const { data: orders, refetch } = useQuery({
    queryKey: ["admin-orders-full"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); refetch(); }
  };

  return (
    <div className="space-y-3 mt-6">
      {!orders?.length && <div className="text-muted-foreground">No orders yet.</div>}
      {orders?.map((o: any) => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</div>
              <div className="font-medium">{o.full_name} · {o.phone}</div>
              <div className="text-sm text-muted-foreground">{o.address}, {o.district}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl">{formatLKR(Number(o.total))}</div>
              <Badge>{o.status}</Badge>
            </div>
          </div>
          <ul className="text-sm mt-3 space-y-1">
            {o.order_items.map((it: any) => <li key={it.id}>{it.name} × {it.qty} — {formatLKR(Number(it.price) * it.qty)}</li>)}
          </ul>
          <div className="grid sm:grid-cols-3 gap-2 mt-4">
            <Select value={o.status} onValueChange={(v) => update(o.id, { status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["pending","confirmed","shipped","delivered","cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Courier (e.g. Domex)" defaultValue={o.courier ?? ""} onBlur={(e) => e.target.value !== (o.courier ?? "") && update(o.id, { courier: e.target.value || null })} />
            <Input placeholder="Tracking number" defaultValue={o.tracking_number ?? ""} onBlur={(e) => e.target.value !== (o.tracking_number ?? "") && update(o.id, { tracking_number: e.target.value || null })} />
          </div>
        </div>
      ))}
    </div>
  );
}
