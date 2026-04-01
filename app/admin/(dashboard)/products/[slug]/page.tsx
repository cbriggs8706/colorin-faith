import { notFound } from "next/navigation";
import { AdminProductEditor } from "@/components/admin-product-editor";
import { getProductBySlug, getProducts, getSiteContent } from "@/lib/store";

export async function generateMetadata(props: PageProps<"/admin/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  return {
    title: product ? `Edit ${product.name}` : "Product not found",
  };
}

export default async function AdminProductPage(props: PageProps<"/admin/products/[slug]">) {
  const { slug } = await props.params;
  const [product, products, siteContent] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getSiteContent(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminProductEditor
      initialProduct={product}
      initialProducts={products}
      initialVariantPricing={siteContent.variantPricing}
    />
  );
}
