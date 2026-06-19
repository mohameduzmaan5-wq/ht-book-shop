import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => ({ redirect: typeof (s as any).redirect === "string" ? (s as any).redirect : "/" }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(72);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) return toast.error("Invalid email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in!");
    nav({ to: redirect as any });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) return toast.error("Invalid email");
    if (!passSchema.safeParse(password).success) return toast.error("Password 6-72 chars");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your email to verify.");
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl hero-bg items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl">Welcome</h1>
        <p className="text-muted-foreground text-sm">Sign in to your HT Book Shop account</p>
      </div>
      <Tabs defaultValue="signin">
        <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Sign up</TabsTrigger></TabsList>
        <TabsContent value="signin">
          <form onSubmit={signIn} className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" disabled={loading} className="w-full">Sign in</Button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={signUp} className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" disabled={loading} className="w-full">Create account</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
