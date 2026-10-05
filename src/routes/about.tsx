import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sipora" },
      { name: "description", content: "Sipora connects people with independent juice bars, cafés and shake shops." },
      { property: "og:title", content: "About Sipora" },
      { property: "og:description", content: "A marketplace built for fresh beverage makers." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-5xl font-extrabold">Fresh drinks, made by real shops.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Sipora brings together independent juice bars, cafés and shake shops so you can discover great drinks nearby —
        from cold-pressed juices to slow pour-over coffee.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          ["For customers", "Browse every shop in one place, compare drinks and order in a few taps."],
          ["For sellers", "Create your shop, list your drinks with photos and manage your menu yourself."],
          ["Quality first", "Shops get a verified badge once our team checks their business details."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-3xl border bg-card p-6">
            <h2 className="text-xl font-semibold">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex gap-3">
        <Button asChild className="rounded-full"><Link to="/menu">Browse drinks</Link></Button>
        <Button asChild variant="outline" className="rounded-full"><Link to="/seller-register">Sell on Sipora</Link></Button>
      </div>
    </div>
  );
}
