import Link from "next/link";
import { createSignedDownloadLinks } from "@/lib/product-assets-server";
import { getProductBySlug } from "@/lib/store";
import { getCheckoutSession } from "@/lib/stripe";

export const metadata = {
  title: "Order Success",
};

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const session = sessionId ? await getCheckoutSession(sessionId) : null;
  const productSlug = session?.metadata?.productSlug;
  const isPaid = session?.payment_status === "paid";
  const product = productSlug ? await getProductBySlug(productSlug) : null;
  const downloads =
    isPaid && product ? await createSignedDownloadLinks(product.downloads) : [];

  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label mx-auto w-fit text-[var(--brand-mint)]">Payment complete</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Thank you for your order.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          {isPaid && product
            ? `Your ${product.name} purchase is confirmed. Use the downloads below to grab your files.`
            : "We could not verify this checkout session yet. If payment just completed, reload this page or contact support."}
        </p>

        {downloads.length > 0 ? (
          <div className="mt-6 grid gap-3 text-left">
            {downloads.map((download) => (
              <a
                key={download.path}
                className="rounded-[1.4rem] bg-[var(--surface-pop)] px-4 py-4 font-bold text-[var(--brand-ink)]"
                href={download.signedUrl}
              >
                Download {download.label}
              </a>
            ))}
          </div>
        ) : null}

        {isPaid && product && downloads.length === 0 ? (
          <p className="mt-6 text-sm font-bold text-slate-600">
            No download files are attached to this product yet.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="primary-button" href="/shop">
            Continue shopping
          </Link>
          <Link className="secondary-button" href="/contact">
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}
