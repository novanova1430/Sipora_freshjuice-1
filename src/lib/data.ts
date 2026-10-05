import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Seller = Tables<"sellers">;
export type Product = Tables<"products"> & {
  categories: Pick<Category, "name" | "slug" | "emoji"> | null;
  sellers: Pick<Seller, "id" | "shop_name" | "is_verified" | "city"> | null;
};

export const PRODUCT_SELECT =
  "*, categories(name,slug,emoji), sellers(id,shop_name,is_verified,city)";

export const inr = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function validateImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WEBP image.";
  if (file.size > 5 * 1024 * 1024) return "Image must be under 5 MB.";
  return null;
}

export async function uploadImage(file: File, userId: string, folder: string) {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (e2) throw e2;
  return data.signedUrl;
}

export async function uploadLicense(file: File, userId: string) {
  const ok = [...IMAGE_TYPES, "application/pdf"];
  if (!ok.includes(file.type)) throw new Error("License must be a PDF or image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("License must be under 10 MB.");
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/license-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("licenses").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function addToCart(userId: string, productId: string, qty = 1) {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: Math.min(50, existing.quantity + qty) })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: userId, product_id: productId, quantity: qty });
    if (error) throw error;
  }
}

export function useCartCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["cart-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", userId!);
      return (data ?? []).reduce((s, r) => s + r.quantity, 0);
    },
  });
}
