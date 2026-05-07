import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, Sun, Moon, Menu, User, LogOut, Shield } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SHOP } from "@/lib/shop";
import type { Lang } from "@/lib/i18n-dictionaries";

export function Header() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const cart = useCart();
  const wl = useWishlist();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    nav({ to: "/books", search: { q } as any });
  };

  const links = (
    <>
      <Link to="/" className="font-medium hover:text-primary">{t("home")}</Link>
      <Link to="/books" className="font-medium hover:text-primary">{t("books")}</Link>
      <Link to="/categories" className="font-medium hover:text-primary">{t("categories")}</Link>
      <Link to="/contact" className="font-medium hover:text-primary">{t("contactUs")}</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex flex-col gap-4 mt-8 text-lg">{links}</div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt={`${SHOP.name} logo`} className="w-10 h-10 rounded-lg object-cover" />
          <div className="hidden sm:block">
            <div className="font-display text-lg leading-none text-slate-950">{SHOP.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{SHOP.city}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5 ml-6">{links}</nav>

        <form onSubmit={submitSearch} className="ml-auto hidden sm:flex flex-1 max-w-sm relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")} className="pl-9"
          />
        </form>

        <div className="flex items-center gap-1 ml-auto sm:ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">{lang.toUpperCase()}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["en","si","ta"] as Lang[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLang(l)}>
                  {l === "en" ? "English" : l === "si" ? "සිංහල" : "தமிழ்"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="w-4 h-4" />
              {wl.ids.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{wl.ids.length}</span>
              )}
            </Button>
          </Link>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cart.count}</span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => nav({ to: "/orders" })}>{t("orders")}</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => nav({ to: "/admin" })}>
                    <Shield className="w-4 h-4 mr-2" />{t("admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}>
                  <LogOut className="w-4 h-4 mr-2" />{t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth"><Button size="sm">{t("signIn")}</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
