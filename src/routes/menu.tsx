import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_SELECT, useCategories, type Product } from "@/lib/data";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";

type S = { q?: string; cat?: string; sort?: "new" | "price-asc" | "price-desc"; avail?: boolean };

export const Route = createFileRoute("/menu")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
    sort: s.sort === "price-asc" || s.sort === "price-desc" ? s.sort : undefined,
    avail: s.avail === true || s.avail === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse beverages — Sipora" },
      { name: "description", content: "Search and filter juices, shakes, smoothies, coffee, tea and mocktails." },
      { property: "og:title", content: "Browse beverages — Sipora" },
      { property: "og:description", content: "Search and filter fresh drinks from local shops." },
    ],
  }),
  component: Menu,
});

function Menu() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/menu" });
  const cats = useCategories();
  const set = (patch: Partial<S>) => nav({ search: (p: S) => ({ ...p, ...patch }) });

  const { data, isLoading } = useQuery({
    queryKey: ["menu", s],
    queryFn: async () => {
      let q = supabase.from("products").select(PRODUCT_SELECT.replace("categories(", "categories!inner("));
      if (s.cat) q = q.eq("categories.slug", s.cat);
      if (s.avail) q = q.eq("is_available", true);
      if (s.q) {
        const t = s.q.replace(/[%,()]/g, " ");
        q = q.or(`name.ilike.%${t}%,short_description.ilike.%${t}%,ingredients.ilike.%${t}%`);
      }
      if (s.sort === "price-asc") q = q.order("price", { ascending: true });
      else if (s.sort === "price-desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold">Browse beverages</h1>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); set({ q: (new FormData(e.currentTarget).get("q") as string) || undefined }); }}
          className="flex flex-1 items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input name="q" defaultValue={s.q} key={s.q} placeholder="Search by drink or ingredient" className="flex-1 bg-transparent py-1 outline-none" />
        </form>
        <select value={s.sort ?? "new"} onChange={(e) => set({ sort: e.target.value === "new" ? undefined : (e.target.value as S["sort"]) })}
          className="h-11 rounded-full border bg-card px-4 text-sm">
          <option value="new">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!s.avail} onChange={(e) => set({ avail: e.target.checked || undefined })} /> Available only
        </label>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => set({ cat: undefined })}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${!s.cat ? "bg-foreground text-background" : "bg-card"}`}>All</button>
        {(cats.data ?? []).map((c) => (
          <button key={c.id} onClick={() => set({ cat: c.slug })}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${s.cat === c.slug ? "bg-foreground text-background" : "bg-card"}`}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {isLoading ? <ProductGridSkeleton n={8} /> : !data?.length ? (
          <div className="rounded-3xl border bg-card p-16 text-center text-muted-foreground">No drinks match your search.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
