import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchRole, friendlyAuthError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/FormBits";

export function LoginForm({ role }: { role: "customer" | "seller" }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Check your email for a reset link.");
        setForgot(false);
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: String(f.get("password")) });
      if (error) throw error;
      const actual = await fetchRole(data.user.id);
      if (actual !== role) toast.info(actual === "seller" ? "This is a seller account — opening your dashboard." : "This is a customer account.");
      nav({ to: actual === "seller" ? "/seller" : "/account", replace: true });
    } catch (err) {
      toast.error(friendlyAuthError((err as Error).message));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      {!forgot && <Field label="Password" name="password" type="password" required autoComplete="current-password" />}
      <div className="flex justify-end">
        <button type="button" className="text-sm text-primary" onClick={() => setForgot(!forgot)}>
          {forgot ? "Back to log in" : "Forgot password?"}
        </button>
      </div>
      <Button className="h-11 w-full rounded-full" disabled={busy}>{forgot ? "Send reset link" : "Log in"}</Button>
    </form>
  );
}

const base = {
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/, "3–30 letters, numbers or _"),
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  password: z.string().min(8, "At least 8 characters").max(72),
  confirm: z.string(),
};
const customerSchema = z.object({ ...base, address: z.string().trim().max(300).optional() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
const sellerSchema = z.object({
  ...base,
  shop_name: z.string().trim().min(2, "Enter your shop name").max(100),
  shop_phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Enter the shop address").max(300),
  city: z.string().trim().min(2, "Required").max(60),
  state: z.string().trim().min(2, "Required").max(60),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, "6-digit pincode"),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export function RegisterForm({ role }: { role: "customer" | "seller" }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = (role === "seller" ? sellerSchema : customerSchema).safeParse(raw);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    const { email, password, confirm: _c, ...meta } = parsed.data as Record<string, string>;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/${role === "seller" ? "seller" : "account"}`, data: { ...meta, role } },
    });
    setBusy(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    if (data.user && data.user.identities?.length === 0) return toast.error("An account with this email already exists.");
    setDone(email);
  };

  if (done) return (
    <div className="rounded-2xl bg-secondary p-6 text-center">
      <p className="text-lg font-semibold">Check your inbox 📬</p>
      <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{done}</b>. Click it to activate your account, then add your photos from your profile.</p>
    </div>
  );

  const F = (p: { label: string; name: string; type?: string; autoComplete?: string }) => <Field {...p} error={errors[p.name]} />;
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {role === "seller" && <div className="sm:col-span-2"><F label="Shop / restaurant name" name="shop_name" /></div>}
      <F label={role === "seller" ? "Seller username" : "Username"} name="username" autoComplete="username" />
      <F label={role === "seller" ? "Owner full name" : "Full name"} name="full_name" autoComplete="name" />
      <F label="Email" name="email" type="email" autoComplete="email" />
      <F label="Phone" name="phone" type="tel" autoComplete="tel" />
      {role === "seller" && <F label="Shop phone" name="shop_phone" type="tel" />}
      <div className={role === "seller" ? "" : "sm:col-span-2"}><F label={role === "seller" ? "Shop address" : "Address (optional)"} name="address" autoComplete="street-address" /></div>
      {role === "seller" && (<><F label="City" name="city" /><F label="State" name="state" /><F label="Pincode" name="pincode" /></>)}
      <F label="Password" name="password" type="password" autoComplete="new-password" />
      <F label="Confirm password" name="confirm" type="password" autoComplete="new-password" />
      <p className="text-xs text-muted-foreground sm:col-span-2">
        {role === "seller" ? "You can upload your shop logo, profile photo and licence document from your dashboard after confirming your email." : "You can add a profile photo after confirming your email."}
      </p>
      <Button className="h-11 rounded-full sm:col-span-2" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
