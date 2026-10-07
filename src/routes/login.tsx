import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "@/components/AuthForms";
import { AuthShell } from "@/components/FormBits";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Sipora" },
      { name: "description", content: "Log in to your Sipora customer account." },
      { property: "og:title", content: "Log in — Sipora" },
      { property: "og:description", content: "Log in to order fresh drinks." },
    ],
  }),
  component: () => (
    <AuthShell title="Welcome back" subtitle="Log in to order your favourite drinks.">
      <LoginForm role="customer" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/register" className="font-medium text-primary">Create an account</Link> · Own a shop?{" "}
        <Link to="/seller-login" className="font-medium text-primary">Seller log in</Link>
      </p>
    </AuthShell>
  ),
});
