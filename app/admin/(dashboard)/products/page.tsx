import { AdminProductCatalog } from "@/components/admin-product-catalog";
import { getProducts, getSiteContent } from "@/lib/store";

export const metadata = {
  title: "Admin Products",
};

export default async function AdminProductsPage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);

  return (
    <AdminProductCatalog
      initialProducts={products}
      initialVariantPricing={siteContent.variantPricing}
    />
  );
}
