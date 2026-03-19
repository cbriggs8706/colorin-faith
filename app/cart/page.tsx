import { CartPageClient } from "@/components/cart-page-client";
import { getProducts } from "@/lib/store";

export const metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const products = await getProducts();

  return (
    <div className="py-6 sm:py-8">
      <CartPageClient products={products} />
    </div>
  );
}
