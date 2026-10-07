import { createFileRoute, Link } from "@tanstack/react-router";
import { RegisterForm } from "@/components/AuthForms";
import { AuthShell } from "@/components/FormBits";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Sipora" },
      { name: "description", content: "Sign up to order fresh drinks from local shops." },
      { property: "og:title", content: "Create account — Sipora" },
      { property: "og:description", content: "Join Sipora as a customer." },
    ],
  }),
  component: () => (
    <AuthShell title="Create your account" subtitle="Order juices, shakes and coffee from shops near you.">
      <RegisterForm role="customer" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-medium text-primary">Log in</Link> · Selling drinks?{" "}
        <Link to="/seller-register" className="font-medium text-primary">Register a shop</Link>
      </p>
    </AuthShell>
  ),
});
