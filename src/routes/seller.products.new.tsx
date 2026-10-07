import { createFileRoute } from "@tanstack/react-router";
import { useMyShop } from "@/lib/seller";
import { ProductForm } from "@/components/ProductForm";
import { PageHeader } from "@/components/FormBits";

export const Route = createFileRoute("/seller/products/new")({
  head: () => ({
    meta: [
      { title: "Add product — Sipora" },
      { name: "description", content: "Add a new drink to your shop." },
      { property: "og:title", content: "Add product — Sipora" },
      { property: "og:description", content: "Add a new drink to your shop." },
    ],
  }),
  component: NewProduct,
});

function NewProduct() {
  const { user } = Route.useRouteContext();
  const shop = useMyShop(user.id);
  return (
    <div>
      <PageHeader title="Add a new drink" subtitle="Fill in the details customers will see." />
      {shop.data && <ProductForm userId={user.id} sellerId={shop.data.id} />}
    </div>
  );
}
