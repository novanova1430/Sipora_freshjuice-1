import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/guards";
import { inr } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/FormBits";

export const Route = createFileRoute("/cart")({
  ssr: false,
  beforeLoad: () => requireRole("customer"),
  head: () => ({
    meta: [
      { title: "Your cart — Sipora" },
      { name: "description", content: "Review your drinks and place your order." },
      { property: "og:title", content: "Your cart — Sipora" },
      { property: "og:description", content: "Review and place your order." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const cart = useQuery({
    queryKey: ["cart", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items")
        .select("id, quantity, products(id, name, price, image_url, volume, is_available, sellers(shop_name))")
        .eq("user_id", user.id).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["cart"] }); qc.invalidateQueries({ queryKey: ["cart-count"] }); };
  const setQty = async (id: string, q: number) => {
    if (q < 1) await supabase.from("cart_items").delete().eq("id", id);
    else await supabase.from("cart_items").update({ quantity: Math.min(50, q) }).eq("id", id);
    refresh();
  };

  const items = cart.data ?? [];
  const valid = items.filter((i) => i.products?.is_available);
  const total = valid.reduce((s, i) => s + Number(i.products!.price) * i.quantity, 0);

  const place = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = String(new FormData(e.currentTarget).get("address")).trim();
    if (address.length < 5) return toast.error("Please enter a delivery address.");
    setBusy(true);
    const { error } = await supabase.rpc("place_order", { _address: address });
    setBusy(false);
    if (error) return toast.error(error.message);
    refresh();
    qc.invalidateQueries({ queryKey: ["orders"] });
    toast.success("Order placed! Pay on delivery.");
    nav({ to: "/account" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader title="Your cart" />
      {cart.isLoading ? <div className="h-40 animate-pulse rounded-3xl bg-muted" /> : !items.length ? (
        <div className="rounded-3xl border bg-card p-16 text-center">
          <p className="text-lg font-semibold">Your cart is empty</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/menu">Browse drinks</Link></Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((i) => i.products && (
              <div key={i.id} className="flex items-center gap-4 rounded-3xl border bg-card p-4">
                <img src={i.products.image_url ?? ""} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <div className="flex-1">
                  <Link to="/product/$id" params={{ id: i.products.id }} className="font-semibold hover:underline">{i.products.name}</Link>
                  <p className="text-sm text-muted-foreground">{i.products.sellers?.shop_name} · {i.products.volume}</p>
                  {!i.products.is_available && <p className="text-xs text-destructive">Currently unavailable — won't be ordered</p>}
                </div>
                <div className="flex items-center rounded-full border">
                  <button className="p-2" aria-label="Less" onClick={() => setQty(i.id, i.quantity - 1)}><Minus className="h-4 w-4" /></button>
                  <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                  <button className="p-2" aria-label="More" onClick={() => setQty(i.id, i.quantity + 1)}><Plus className="h-4 w-4" /></button>
                </div>
                <span className="w-20 text-right font-semibold">{inr(Number(i.products.price) * i.quantity)}</span>
                <button aria-label="Remove" onClick={() => setQty(i.id, 0)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <form onSubmit={place} className="h-fit space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
            <h2 className="text-xl font-bold">Order summary</h2>
            <div className="flex justify-between text-sm"><span>Items</span><span>{valid.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery</span><span>Free</span></div>
            <div className="flex justify-between border-t pt-4 text-lg font-bold"><span>Total</span><span className="text-primary">{inr(total)}</span></div>
            <div>
              <label htmlFor="address" className="text-sm font-medium">Delivery address</label>
              <Textarea id="address" name="address" key={profile.data?.address ?? ""} defaultValue={profile.data?.address ?? ""} className="mt-1.5 rounded-xl" rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">Payment: cash on delivery. Online payments coming soon.</p>
            <Button className="h-11 w-full rounded-full" disabled={busy || !valid.length}>Place order</Button>
          </form>
        </div>
      )}
    </div>
  );
}
