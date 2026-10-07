import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage, useCategories, validateImage, type Product } from "@/lib/data";
import { Field } from "@/components/FormBits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  category_id: z.string().uuid("Choose a category"),
  short_description: z.string().trim().min(5, "Add a short description").max(300),
  ingredients: z.string().trim().min(2, "List the ingredients").max(300),
  volume: z.string().trim().min(2, "e.g. 300 ml").max(30),
  price: z.coerce.number().min(1, "Enter a price").max(100000),
});

export function ProductForm({ userId, sellerId, product }: { userId: string; sellerId: string; product?: Product | null }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const cats = useCategories();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);
  const [avail, setAvail] = useState(product?.is_available ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    setErrors({});
    setBusy(true);
    try {
      const image_url = file ? await uploadImage(file, userId, "products") : product?.image_url ?? null;
      const row = { ...parsed.data, is_available: avail, image_url };
      const { error } = product
        ? await supabase.from("products").update(row).eq("id", product.id)
        : await supabase.from("products").insert({ ...row, seller_id: sellerId });
      if (error) throw error;
      qc.invalidateQueries();
      toast.success(product ? "Product updated." : "Product added.");
      nav({ to: "/seller" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 rounded-3xl border bg-card p-6 md:grid-cols-[240px_1fr]">
      <div>
        <Label>Product image</Label>
        <label className="mt-1.5 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-muted">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <span className="p-4 text-center text-sm text-muted-foreground">Click to upload JPG, PNG or WEBP (max 5 MB)</span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const err = validateImage(f);
            if (err) return toast.error(err);
            setFile(f); setPreview(URL.createObjectURL(f));
          }} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Product name" name="name" defaultValue={product?.name} error={errors.name} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} className="h-11 w-full rounded-xl border bg-background px-3">
            <option value="" disabled>Choose…</option>
            {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
        </div>
        <Field label="Price (₹)" name="price" type="number" min={1} step="0.01" defaultValue={product?.price} error={errors.price} />
        <Field label="Quantity / volume" name="volume" placeholder="300 ml" defaultValue={product?.volume} error={errors.volume} />
        <Field label="Ingredients (comma separated)" name="ingredients" placeholder="Mango, Water, Ice" defaultValue={product?.ingredients} error={errors.ingredients} />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="short_description">Short description</Label>
          <Textarea id="short_description" name="short_description" rows={3} defaultValue={product?.short_description} className="rounded-xl" />
          {errors.short_description && <p className="text-xs text-destructive">{errors.short_description}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={avail} onCheckedChange={setAvail} /> Available for order</label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => nav({ to: "/seller" })}>Cancel</Button>
          <Button className="rounded-full" disabled={busy}>{busy ? "Saving…" : product ? "Save changes" : "Add product"}</Button>
        </div>
      </div>
    </form>
  );
}
