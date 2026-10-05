import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_SELECT, type Product } from "@/lib/data";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";

export const Route = createFileRoute("/shops/$id")({
  head: () => ({
    meta: [
      { title: "Shop — Sipora" },
      { name: "description", content: "See this shop's details and full drinks menu." },
      { property: "og:title", content: "Shop — Sipora" },
      { property: "og:description", content: "Browse this shop's drinks on Sipora." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { id } = Route.useParams();
  const shop = useQuery({
    queryKey: ["shop", id],
    queryFn: async () => (await supabase.from("sellers").select("id,shop_name,owner_name,city,state,address,shop_phone,logo_url,description,is_verified").eq("id", id).maybeSingle()).data,
  });
  const products = useQuery({
    queryKey: ["shop-products", id],
    queryFn: async () => ((await supabase.from("products").select(PRODUCT_SELECT).eq("seller_id", id).order("created_at", { ascending: false })).data ?? []) as Product[],
  });
  const s = shop.data;
  if (shop.isLoading) return <div className="mx-auto max-w-7xl p-12"><div className="h-48 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!s) return <div className="p-24 text-center text-xl font-semibold">Shop not found</div>;

  return (
    <div>
      <section className="bg-gradient-sunrise">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-12 sm:px-6">
          {s.logo_url ? <img src={s.logo_url} alt="" className="h-28 w-28 rounded-3xl object-cover shadow-lift" />
            : <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-card shadow-lift"><Store className="h-10 w-10" /></div>}
          <div>
            <h1 className="flex items-center gap-2 text-4xl font-extrabold">{s.shop_name}{s.is_verified && <BadgeCheck className="h-7 w-7 text-primary" />}</h1>
            <p className="mt-1 text-muted-foreground">by {s.owner_name || "the owner"} · {s.is_verified ? "Verified shop" : "Not yet verified"}</p>
            {s.description && <p className="mt-3 max-w-xl">{s.description}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {(s.address || s.city) && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[s.address, s.city, s.state].filter(Boolean).join(", ")}</span>}
              {s.shop_phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{s.shop_phone}</span>}
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold">Menu ({products.data?.length ?? 0})</h2>
        {products.isLoading ? <ProductGridSkeleton /> : !products.data?.length ? <p className="text-muted-foreground">No drinks listed yet.</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.data.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
