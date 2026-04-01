import Link from "next/link";
import { AdminCustomOrderManager } from "@/components/admin-custom-order-manager";
import { AdminCustomProductManager } from "@/components/admin-custom-product-manager";
import { getAllCustomOrdersWithUrls } from "@/lib/custom-orders";
import { getCustomProduct } from "@/lib/custom-product-store";

export const metadata = {
  title: "Custom Order Admin",
};

export default async function AdminCustomOrderPage() {
  const [product, orders] = await Promise.all([getCustomProduct(), getAllCustomOrdersWithUrls()]);

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="pill-label w-fit text-[var(--brand-berry)]">Dedicated admin</p>
          <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)]">
            Custom product and fulfillment
          </h1>
        </div>
        <Link className="secondary-button" href="/admin">
          Back to main admin
        </Link>
      </div>

      <AdminCustomProductManager initialProduct={product} />
      <AdminCustomOrderManager initialOrders={orders} />
    </div>
  );
}
