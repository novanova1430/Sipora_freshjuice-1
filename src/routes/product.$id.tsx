import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Minus, Plus, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addToCart, inr, PRODUCT_SELECT, type Product } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Beverage details — Sipora" },
      { name: "description", content: "Ingredients, size, price and shop details for this drink." },
      { property: "og:title", content: "Beverage details — Sipora" },
      { property: "og:description", content: "See ingredients, size and price, then add it to your cart." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
      return data as Product | null;
    },
  });

  if (isLoading) return <div className="mx-auto max-w-6xl p-12"><div className="h-96 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!p) return <div className="p-24 text-center"><h1 className="text-2xl font-bold">Drink not found</h1><Link to="/menu" className="mt-4 inline-block text-primary">Back to browse</Link></div>;

  const add = async () => {
    if (!user) return nav({ to: "/login" });
    if (role !== "customer") return toast.error("Seller accounts can't place orders. Use a customer account.");
    setBusy(true);
    try {
      await addToCart(user.id, p.id, qty);
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success(`${p.name} added to cart`, { action: { label: "View cart", onClick: () => nav({ to: "/cart" }) } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-sunrise blur-2xl" aria-hidden />
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="relative aspect-square w-full animate-liquid rounded-[2rem] object-cover shadow-lift" />
        ) : <div className="relative flex aspect-square items-center justify-center rounded-[2rem] bg-muted text-8xl">{p.categories?.emoji}</div>}
      </div>
      <div className="animate-rise">
        <Link to="/menu" search={{ cat: p.categories?.slug }} className="text-sm font-medium text-primary">{p.categories?.emoji} {p.categories?.name}</Link>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{p.name}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{p.short_description}</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="font-display text-4xl font-bold text-primary">{inr(p.price)}</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm">{p.volume}</span>
          <span className={`rounded-full px-3 py-1 text-sm ${p.is_available ? "bg-secondary text-success" : "bg-destructive/10 text-destructive"}`}>
            {p.is_available ? "Available" : "Sold out"}
          </span>
        </div>
        <div className="mt-8">
          <h2 className="font-semibold">Ingredients</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.ingredients.split(",").map((i) => i.trim()).filter(Boolean).map((i) => (
              <span key={i} className="rounded-full border bg-card px-3 py-1 text-sm">{i}</span>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex items-center rounded-full border bg-card">
            <button className="p-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button className="p-3" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="More"><Plus className="h-4 w-4" /></button>
          </div>
          <Button size="lg" className="h-12 flex-1 rounded-full" disabled={!p.is_available || busy} onClick={add}>
            <ShoppingBag /> Add to cart
          </Button>
        </div>
        {p.sellers && (
          <Link to="/shops/$id" params={{ id: p.sellers.id }} className="mt-8 flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"><Store className="h-5 w-5" /></div>
            <div>
              <p className="flex items-center gap-1 font-semibold">{p.sellers.shop_name}{p.sellers.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
              <p className="text-sm text-muted-foreground">{p.sellers.city ?? "Local shop"} · View shop</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
