import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Leaf, Truck, ShieldCheck, Store, BadgeCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_SELECT, useCategories, type Product } from "@/lib/data";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sipora — Fresh juices, shakes & coffee from local shops" },
      { name: "description", content: "Discover fresh juices, milkshakes, smoothies, coffee and mocktails from independent beverage shops." },
      { property: "og:title", content: "Sipora — Fresh beverages from local shops" },
      { property: "og:description", content: "A marketplace for fresh juices, shakes, coffee and mocktails." },
    ],
  }),
  component: Home,
});

function useProducts(key: string, build: (q: any) => any) {
  return useQuery({
    queryKey: ["home", key],
    queryFn: async () => {
      const { data, error } = await build(supabase.from("products").select(PRODUCT_SELECT));
      if (error) throw error;
      return data as Product[];
    },
  });
}

function Section({ title, subtitle, link, children }: { title: string; subtitle?: string; link?: { cat?: string }; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        {link && <Link to="/menu" search={link} className="text-sm font-medium text-primary hover:underline">See all →</Link>}
      </div>
      {children}
    </section>
  );
}

function Grid({ q }: { q: ReturnType<typeof useProducts> }) {
  if (q.isLoading) return <ProductGridSkeleton />;
  if (!q.data?.length) return <p className="text-muted-foreground">Nothing here yet.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {q.data.map((p, i) => (
        <div key={p.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}><ProductCard p={p} /></div>
      ))}
    </div>
  );
}

function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const cats = useCategories();
  const featured = useProducts("featured", (b) => b.eq("is_featured", true).limit(8));
  const juices = useProducts("juice", (b) => b.in("categories.slug", ["fresh-juice", "fruit-juice", "lemonade"]).not("categories", "is", null).limit(4));
  const shakes = useProducts("shakes", (b) => b.in("categories.slug", ["milkshake", "smoothie"]).not("categories", "is", null).limit(4));
  const coffee = useProducts("coffee", (b) => b.in("categories.slug", ["coffee", "cold-coffee", "black-coffee", "tea"]).not("categories", "is", null).limit(4));
  const sellers = useQuery({
    queryKey: ["home", "sellers"],
    queryFn: async () => (await supabase.from("sellers").select("*").order("is_verified", { ascending: false }).limit(6)).data ?? [],
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-sunrise">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-medium shadow-soft">
              <Leaf className="h-4 w-4 text-primary" /> Squeezed, shaken & brewed today
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Every <span className="text-citrus">fresh</span> sip,<br /> from shops you'll <span className="text-berry">love</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Juices, shakes, smoothies, coffee and mocktails from independent beverage makers — all in one place.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); nav({ to: "/menu", search: { q } }); }}
              className="mt-8 flex max-w-lg items-center gap-2 rounded-full border bg-card p-2 shadow-lift"
            >
              <Search className="ml-3 h-5 w-5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mango, latte, mojito…"
                className="flex-1 bg-transparent px-2 py-2 outline-none" aria-label="Search beverages" />
              <Button type="submit" className="rounded-full px-6">Search</Button>
            </form>
          </div>
          <div className="relative">
            <img src={hero} alt="Fresh mango juice, strawberry shake, iced latte and lemonade" width={1600} height={1104}
              className="animate-float rounded-[2.5rem] object-cover shadow-lift" />
          </div>
        </div>
      </section>

      <Section title="Shop by category" subtitle="Find exactly what you're craving">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(cats.data ?? []).map((c) => (
            <Link key={c.id} to="/menu" search={{ cat: c.slug }}
              className="flex min-w-28 flex-col items-center gap-2 rounded-3xl border bg-card px-5 py-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-soft">
              <span className="text-3xl">{c.emoji}</span>
              <span className="whitespace-nowrap text-sm font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Popular right now" subtitle="Handpicked favourites" link={{}}><Grid q={featured} /></Section>
      <Section title="Fresh juices & lemonades" link={{ cat: "fresh-juice" }}><Grid q={juices} /></Section>
      <Section title="Shakes & smoothies" link={{ cat: "milkshake" }}><Grid q={shakes} /></Section>
      <Section title="Coffee & tea" link={{ cat: "coffee" }}><Grid q={coffee} /></Section>

      <Section title="Featured shops">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(sellers.data ?? []).map((s) => (
            <Link key={s.id} to="/shops/$id" params={{ id: s.id }}
              className="flex items-center gap-4 rounded-3xl border bg-card p-5 transition hover:shadow-lift">
              {s.logo_url ? <img src={s.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" loading="lazy" />
                : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Store /></div>}
              <div>
                <p className="flex items-center gap-1 font-semibold">{s.shop_name}{s.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
                <p className="text-sm text-muted-foreground">{s.city ?? "Local shop"}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Why Sipora">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Leaf, t: "Made fresh", d: "Every drink is prepared to order by the shop.", c: "bg-secondary text-primary" },
            { icon: ShieldCheck, t: "Verified shops", d: "We check seller details before showing the badge.", c: "bg-accent text-citrus" },
            { icon: Truck, t: "Simple ordering", d: "Add to cart and check out in seconds.", c: "bg-muted text-berry" },
          ].map(({ icon: I, t, d, c }) => (
            <div key={t} className="rounded-3xl border bg-card p-7">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c}`}><I /></div>
              <h3 className="mt-5 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2.5rem] bg-gradient-fresh px-8 py-14 text-center text-primary-foreground sm:px-16">
          <h2 className="text-4xl font-bold">Run a juice bar or café?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">List your drinks on Sipora and reach customers nearby.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full">
            <Link to="/seller-register">Become a seller</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
