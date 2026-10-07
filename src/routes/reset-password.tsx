import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "@/components/FormBits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Sipora" },
      { name: "description", content: "Choose a new password for your Sipora account." },
      { property: "og:title", content: "Reset password — Sipora" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <AuthShell title="Set a new password" subtitle="Enter a new password for your account.">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const p = String(f.get("password"));
        if (p.length < 8) return toast.error("At least 8 characters.");
        if (p !== f.get("confirm")) return toast.error("Passwords don't match.");
        setBusy(true);
        const { error } = await supabase.auth.updateUser({ password: p });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success("Password updated.");
        nav({ to: "/" });
      }}>
        <Field label="New password" name="password" type="password" required />
        <Field label="Confirm password" name="confirm" type="password" required />
        <Button className="h-11 w-full rounded-full" disabled={busy}>Update password</Button>
      </form>
    </AuthShell>
  );
}
