import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage, uploadLicense } from "@/lib/data";
import { useMyShop } from "@/lib/seller";
import { Field, PageHeader } from "@/components/FormBits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChangePassword, DeleteAccount, ImagePicker } from "@/components/AccountBits";

export const Route = createFileRoute("/seller/profile")({
  head: () => ({
    meta: [
      { title: "Shop profile — Sipora" },
      { name: "description", content: "Edit your shop details, logo and licence." },
      { property: "og:title", content: "Shop profile — Sipora" },
      { property: "og:description", content: "Edit your shop details." },
    ],
  }),
  component: ShopProfile,
});

function ShopProfile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const shop = useMyShop(user.id);
  const [busy, setBusy] = useState(false);
  const s = shop.data;
  if (!s) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;

  const patch = async (row: Record<string, any>) => {
    const { error } = await supabase.from("sellers").update(row as never).eq("id", s.id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (f.shop_name.trim().length < 2) return toast.error("Enter your shop name.");
    if (f.pincode && !/^[0-9]{6}$/.test(f.pincode)) return toast.error("Pincode must be 6 digits.");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Enter a valid email.");
    setBusy(true);
    try {
      await patch(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])));
      toast.success("Shop profile saved.");
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Shop profile" subtitle={s.is_verified ? "Your shop is verified." : "Not verified yet — upload your business licence below."} />
      <div className="flex flex-wrap gap-8 rounded-3xl border bg-card p-6">
        <div className="text-center"><ImagePicker label="Shop logo" url={s.logo_url} onFile={async (f) => patch({ logo_url: await uploadImage(f, user.id, "logo") })} /><p className="mt-2 text-xs text-muted-foreground">Shop logo</p></div>
        <div className="text-center"><ImagePicker round label="Your photo" url={s.avatar_url} onFile={async (f) => patch({ avatar_url: await uploadImage(f, user.id, "avatar") })} /><p className="mt-2 text-xs text-muted-foreground">Profile photo</p></div>
        <div className="flex-1 space-y-2">
          <p className="flex items-center gap-1 font-semibold">{s.is_verified ? <><BadgeCheck className="h-4 w-4 text-primary" /> Verified</> : "Unverified"}</p>
          <Label>Business / licence document (PDF or image, private)</Label>
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="block text-sm" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { await patch({ license_path: await uploadLicense(f, user.id) }); toast.success("Licence uploaded."); }
            catch (err) { toast.error((err as Error).message); }
          }} />
          {s.license_path && <p className="flex items-center gap-1 text-sm text-success"><FileCheck className="h-4 w-4" /> Licence on file</p>}
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 sm:grid-cols-2">
        <Field label="Shop name" name="shop_name" defaultValue={s.shop_name} />
        <Field label="Owner name" name="owner_name" defaultValue={s.owner_name} />
        <Field label="Email" name="email" type="email" defaultValue={s.email ?? ""} />
        <Field label="Phone" name="phone" defaultValue={s.phone ?? ""} />
        <Field label="Shop phone" name="shop_phone" defaultValue={s.shop_phone ?? ""} />
        <Field label="Address" name="address" defaultValue={s.address ?? ""} />
        <Field label="City" name="city" defaultValue={s.city ?? ""} />
        <Field label="State" name="state" defaultValue={s.state ?? ""} />
        <Field label="Pincode" name="pincode" defaultValue={s.pincode ?? ""} />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">About your shop</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={s.description ?? ""} className="rounded-xl" />
        </div>
        <Button className="w-fit rounded-full" disabled={busy}>Save shop profile</Button>
      </form>

      <div className="mt-6 space-y-6 rounded-3xl border bg-card p-6">
        <h3 className="font-semibold">Change password</h3>
        <ChangePassword email={user.email!} />
        <div className="border-t pt-6"><DeleteAccount /></div>
      </div>
    </div>
  );
}
