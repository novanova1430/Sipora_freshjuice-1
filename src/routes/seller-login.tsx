import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "@/components/AuthForms";
import { AuthShell } from "@/components/FormBits";

export const Route = createFileRoute("/seller-login")({
  head: () => ({
    meta: [
      { title: "Seller log in — Sipora" },
      { name: "description", content: "Log in to manage your shop and drinks on Sipora." },
      { property: "og:title", content: "Seller log in — Sipora" },
      { property: "og:description", content: "Manage your beverage shop." },
    ],
  }),
  component: () => (
    <AuthShell title="Seller log in" subtitle="Manage your shop, menu and profile." accent="sunrise">
      <LoginForm role="seller" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have a shop yet? <Link to="/seller-register" className="font-medium text-primary">Register your shop</Link>
      </p>
    </AuthShell>
  ),
});
