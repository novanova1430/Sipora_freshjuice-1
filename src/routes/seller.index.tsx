import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/data";
import { useMyShop } from "@/lib/seller";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/seller/")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — Sipora" },
      { name: "description", content: "Manage your shop's drinks and see your stats." },
      { property: "og:title", content: "Seller dashboard — Sipora" },
      { property: "og:description", content: "Manage your beverage shop." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const shop = useMyShop(user.id);
  const products = useQuery({
    queryKey: ["my-products", shop.data?.id],
    enabled: !!shop.data,
    queryFn: async () => (await supabase.from("products").select("*, categories(name, emoji)").eq("seller_id", shop.data!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const orders = useQuery({
    queryKey: ["my-orders", shop.data?.id],
    enabled: !!shop.data,
    queryFn: async () => (await supabase.from("order_items").select("quantity, unit_price").eq("seller_id", shop.data!.id)).data ?? [],
  });
  const list = products.data ?? [];
  const avail = list.filter((p) => p.is_available).length;
  const revenue = (orders.data ?? []).reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-products"] });

  const toggle = async (id: string, v: boolean) => {
    const { error } = await supabase.from("products").update({ is_available: v }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Product deleted."); refresh(); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-gradient-fresh p-8 text-primary-foreground">
        <div>
          <p className="opacity-80">Welcome, {shop.data?.owner_name || "seller"}</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold">{shop.data?.shop_name}{shop.data?.is_verified && <BadgeCheck />}</h1>
          <p className="mt-1 text-sm opacity-80">{shop.data?.is_verified ? "Verified shop" : "Verification pending — upload your licence in Shop profile."}</p>
        </div>
        <div className="flex gap-2">
          {shop.data && <Button asChild variant="secondary" className="rounded-full"><Link to="/shops/$id" params={{ id: shop.data.id }}>View shop</Link></Button>}
          <Button asChild variant="secondary" className="rounded-full"><Link to="/seller/products/new"><Plus /> Add product</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[["Total products", list.length], ["Available", avail], ["Unavailable", list.length - avail], ["Sales", inr(revenue)]].map(([l, v]) => (
          <div key={l} className="rounded-3xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-2xl font-bold">Manage products</h2>
      {!list.length ? (
        <div className="rounded-3xl border bg-card p-12 text-center">
          <p className="font-semibold">No products yet</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/seller/products/new">Add your first drink</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card p-4">
              {p.image_url ? <img src={p.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-2xl">{p.categories?.emoji}</div>}
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.categories?.name} · {p.volume} · {inr(p.price)}</p>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={p.is_available} onCheckedChange={(v) => toggle(p.id, v)} /> Available</label>
              <Button asChild variant="outline" size="icon" className="rounded-full"><Link to="/seller/products/$id" params={{ id: p.id }} aria-label="Edit"><Pencil /></Link></Button>
              <Button variant="outline" size="icon" className="rounded-full" aria-label="Delete" onClick={() => remove(p.id, p.name)}><Trash2 /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
