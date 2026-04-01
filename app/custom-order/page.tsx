import Link from "next/link";
import { CustomProductClient } from "@/components/custom-product-client";
import { getCustomProduct } from "@/lib/custom-product-store";

export const metadata = {
  title: "Custom Order",
};

export default async function CustomOrderPage() {
  const product = await getCustomProduct();

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="pill-label w-fit text-[var(--brand-coral)]">Custom order</p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
            Upload your image or PDF, complete checkout, and we&apos;ll create your finished custom files for download in your account.
          </p>
        </div>
        <Link className="secondary-button" href="/orders">
          View my orders
        </Link>
      </div>

      <CustomProductClient product={product} />
    </div>
  );
}
