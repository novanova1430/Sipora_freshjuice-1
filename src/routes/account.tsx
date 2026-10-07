import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/guards";
import { inr, PRODUCT_SELECT, uploadImage, useCategories, type Product } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { Field } from "@/components/FormBits";
import { Button } from "@/components/ui/button";
import { ChangePassword, DeleteAccount, ImagePicker } from "@/components/AccountBits";

export const Route = createFileRoute("/account")({
  ssr: false,
  beforeLoad: () => requireRole("customer"),
  head: () => ({
    meta: [
      { title: "My account — Sipora" },
      { name: "description", content: "Your profile, orders and favourite drinks." },
      { property: "og:title", content: "My account — Sipora" },
      { property: "og:description", content: "Manage your Sipora account." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const cats = useCategories();
  const [busy, setBusy] = useState(false);
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).single()).data,
  });
  const orders = useQuery({
    queryKey: ["orders", user.id],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(product_name, quantity, unit_price)").order("created_at", { ascending: false })).data ?? [],
  });
  const recent = useQuery({
    queryKey: ["recent-products"],
    queryFn: async () => ((await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(4)).data ?? []) as Product[],
  });
  const p = profile.data;

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (f.full_name.trim().length < 2) return toast.error("Enter your full name.");
    if (f.phone && !/^[0-9+\-\s]{7,15}$/.test(f.phone)) return toast.error("Enter a valid phone number.");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: f.full_name.trim(), phone: f.phone.trim() || null, address: f.address.trim() || null }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved.");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center gap-6 rounded-[2rem] bg-gradient-sunrise p-8">
        <ImagePicker round label="Profile photo" url={p?.avatar_url} onFile={async (f) => {
          const url = await uploadImage(f, user.id, "avatar");
          await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
          qc.invalidateQueries({ queryKey: ["profile"] });
        }} />
        <div>
          <h1 className="text-3xl font-bold">Hi, {p?.full_name || "there"} 👋</h1>
          <p className="text-muted-foreground">@{p?.username} · {user.email} · member since {p && new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
        </div>
        <Button asChild className="ml-auto rounded-full"><Link to="/menu">Browse drinks</Link></Button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {(cats.data ?? []).map((c) => (
          <Link key={c.id} to="/menu" search={{ cat: c.slug }} className="whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm hover:border-primary">{c.emoji} {c.name}</Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">My orders</h2>
        {!orders.data?.length ? <p className="text-muted-foreground">No orders yet.</p> : (
          <div className="space-y-3">
            {orders.data.map((o) => (
              <div key={o.id} className="rounded-3xl border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">Order #{o.id.slice(0, 8)}</span>
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-sm capitalize">{o.status}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")} · {o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}</p>
                <p className="mt-2 font-bold text-primary">{inr(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">New on Sipora</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{(recent.data ?? []).map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section>

      <section className="mt-10 space-y-6 rounded-3xl border bg-card p-6">
        <h2 className="text-2xl font-bold">Profile</h2>
        {p && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="full_name" defaultValue={p.full_name} />
            <Field label="Phone" name="phone" defaultValue={p.phone ?? ""} />
            <div className="sm:col-span-2"><Field label="Address" name="address" defaultValue={p.address ?? ""} /></div>
            <Button className="w-fit rounded-full" disabled={busy}>Save changes</Button>
          </form>
        )}
        <div className="border-t pt-6"><h3 className="mb-4 font-semibold">Change password</h3><ChangePassword email={user.email!} /></div>
        <div className="border-t pt-6"><DeleteAccount /></div>
      </section>
    </div>
  );
}
