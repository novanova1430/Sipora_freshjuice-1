import { createFileRoute, Link } from "@tanstack/react-router";
import { RegisterForm } from "@/components/AuthForms";
import { AuthShell } from "@/components/FormBits";

export const Route = createFileRoute("/seller-register")({
  head: () => ({
    meta: [
      { title: "Become a seller — Sipora" },
      { name: "description", content: "Register your juice bar, café or shake shop on Sipora." },
      { property: "og:title", content: "Become a seller — Sipora" },
      { property: "og:description", content: "List your drinks and reach new customers." },
    ],
  }),
  component: () => (
    <AuthShell title="Register your shop" subtitle="List your drinks and reach customers nearby." accent="sunrise">
      <RegisterForm role="seller" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already selling? <Link to="/seller-login" className="font-medium text-primary">Seller log in</Link>
      </p>
    </AuthShell>
  ),
});
