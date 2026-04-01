import { AdminProductEditor } from "@/components/admin-product-editor";
import { getProducts, getSiteContent } from "@/lib/store";

export const metadata = {
  title: "New Product",
};

export default async function AdminNewProductPage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);

  return (
    <AdminProductEditor
      initialProducts={products}
      initialVariantPricing={siteContent.variantPricing}
    />
  );
}
