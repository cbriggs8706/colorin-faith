import Link from "next/link";
import { AdminCustomProductManager } from "@/components/admin-custom-product-manager";
import { getCustomProduct } from "@/lib/custom-product-store";

export const metadata = {
  title: "Custom Order Admin",
};

export default async function AdminCustomOrderPage() {
  const product = await getCustomProduct();

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="pill-label w-fit text-[var(--brand-berry)]">Dedicated admin</p>
          <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)]">
            Custom product settings
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Manage the featured custom offer and Stripe pricing here. Custom-order fulfillment now
            lives in the orders dashboard.
          </p>
        </div>
        <Link className="secondary-button" href="/admin/orders">
          Go to orders dashboard
        </Link>
      </div>

      <AdminCustomProductManager initialProduct={product} />
    </div>
  );
}
