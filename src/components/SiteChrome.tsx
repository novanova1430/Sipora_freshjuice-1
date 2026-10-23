import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingBag, X, GlassWater } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCartCount } from "@/lib/data";
import { Button } from "@/components/ui/button";

export function Logo() {
  return (
    <Link to="/" className="sipora-logo flex items-center gap-2 font-display text-xl font-bold">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-fresh text-primary-foreground">
        <GlassWater className="sipora-cup h-5 w-5" />
      </span>
      Sipora
    </Link>
  );
}

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const { data: count } = useCartCount(role === "customer" ? user?.id : undefined);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Home" },
    { to: "/menu", label: "Browse" },
    { to: "/about", label: "About" },
  ] as const;

  const out = async () => {
    await signOut();
    nav({ to: "/", replace: true });
  };

  const right = user ? (
    <>
      {role === "seller" ? (
        <Button asChild variant="outline" className="rounded-full"><Link to="/seller">Seller dashboard</Link></Button>
      ) : (
        <>
          <Link to="/cart" className="relative rounded-full p-2 hover:bg-muted" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {!!count && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <Button asChild variant="outline" className="rounded-full"><Link to="/account">My account</Link></Button>
        </>
      )}
      <Button variant="ghost" className="rounded-full" onClick={out}>Log out</Button>
    </>
  ) : (
    <>
      <Button asChild variant="ghost" className="rounded-full"><Link to="/login">Log in</Link></Button>
      <Button asChild className="rounded-full"><Link to="/register">Sign up</Link></Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }} activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{right}</div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t px-4 py-4 md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="py-2 font-medium">{l.label}</Link>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">{right}</div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Fresh juices, shakes, coffee and more — from independent shops near you.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Explore</span>
          <Link to="/menu" className="text-muted-foreground hover:text-foreground">Browse drinks</Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">About us</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">For shops</span>
          <Link to="/seller-register" className="text-muted-foreground hover:text-foreground">Become a seller</Link>
          <Link to="/seller-login" className="text-muted-foreground hover:text-foreground">Seller log in</Link>
        </div>
      </div>
      <p className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Sipora</p>
    </footer>
  );
}
