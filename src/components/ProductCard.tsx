import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { inr, type Product } from "@/lib/data";

export function ProductCard({ p }: { p: Product }) {
  const ingredients = p.ingredients.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">{p.categories?.emoji ?? "🥤"}</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur">
          {p.categories?.emoji} {p.categories?.name}
        </span>
        {!p.is_available && (
          <span className="absolute right-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
          <span className="whitespace-nowrap font-display text-lg font-bold text-primary">{inr(p.price)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{p.short_description}</p>
        {ingredients.length > 0 && (
          <p className="text-xs text-muted-foreground">{ingredients.join(" • ")}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 text-xs">
          <span className="flex items-center gap-1 font-medium">
            {p.sellers?.shop_name}
            {p.sellers?.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{p.volume}</span>
        </div>
        <span className="mt-2 rounded-full bg-foreground/5 py-2 text-center text-sm font-medium transition group-hover:bg-primary group-hover:text-primary-foreground">
          View details
        </span>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-96 animate-pulse rounded-3xl bg-muted" />
      ))}
    </div>
  );
}
