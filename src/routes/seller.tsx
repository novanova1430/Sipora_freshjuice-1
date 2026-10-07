import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/guards";

export const Route = createFileRoute("/seller")({
  ssr: false,
  beforeLoad: () => requireRole("seller"),
  component: SellerLayout,
});

function SellerLayout() {
  const tabs = [
    { to: "/seller", label: "Dashboard" },
    { to: "/seller/products/new", label: "Add product" },
    { to: "/seller/profile", label: "Shop profile" },
  ] as const;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: true }}
            className="whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm font-medium"
            activeProps={{ className: "bg-foreground text-background" }}>{t.label}</Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
