import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_SELECT, type Product } from "@/lib/data";
import { useMyShop } from "@/lib/seller";
import { ProductForm } from "@/components/ProductForm";
import { PageHeader } from "@/components/FormBits";

export const Route = createFileRoute("/seller/products/$id")({
  head: () => ({
    meta: [
      { title: "Edit product — Sipora" },
      { name: "description", content: "Update one of your drinks." },
      { property: "og:title", content: "Edit product — Sipora" },
      { property: "og:description", content: "Update one of your drinks." },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const shop = useMyShop(user.id);
  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle()).data as Product | null,
  });
  if (!shop.data || product.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  if (!product.data || product.data.seller_id !== shop.data.id)
    return <p className="rounded-3xl border bg-card p-12 text-center">You can only edit products from your own shop.</p>;
  return (
    <div>
      <PageHeader title={`Edit ${product.data.name}`} />
      <ProductForm userId={user.id} sellerId={shop.data.id} product={product.data} />
    </div>
  );
}
