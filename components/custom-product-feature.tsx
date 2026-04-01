import Image from "next/image";
import Link from "next/link";
import { getProductImageUrl } from "@/lib/product-assets";
import type { CustomProduct } from "@/lib/types";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function CustomProductFeature({ product }: { product: CustomProduct }) {
  const imageUrl = product.listingImagePath
    ? getProductImageUrl(product.listingImagePath)
    : product.images[0]?.path
      ? getProductImageUrl(product.images[0].path)
      : "";
  const minimumPrice = product.pagePrices
    .filter((entry) => entry.unitAmount !== null && entry.unitAmount > 0 && entry.currency)
    .sort((left, right) => (left.unitAmount ?? 0) - (right.unitAmount ?? 0))[0];
  const minimumPriceLabel = minimumPrice
    ? formatPrice(minimumPrice.unitAmount, minimumPrice.currency)
    : null;

  return (
    <section className="rounded-[2rem] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7">
      <div className="lg:grid lg:gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <p className="pill-label w-fit text-[var(--brand-coral)]">{product.featuredEyebrow}</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
            {product.featuredTitle}
          </h2>
          {minimumPriceLabel ? (
            <p className="mt-3 text-xl font-black text-[var(--brand-ink)]">
              From {minimumPriceLabel}
            </p>
          ) : null}
        </div>
        <div
          className="relative mt-5 min-h-[280px] overflow-hidden rounded-[1.75rem] lg:mt-0"
          style={{ background: product.gradient }}
        >
          {imageUrl ? (
            <Image
              alt={product.name}
              className="h-full w-full object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              src={imageUrl}
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-end p-6">
              <div className="rounded-[1.5rem] bg-white/85 px-5 py-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
                  {product.category}
                </p>
                <p className="mt-3 text-lg font-black text-[var(--brand-ink)]">
                  Upload your image, choose your size, and we&apos;ll take it from there.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 lg:mt-4">
            {product.featuredDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
            <span className="rounded-full bg-[var(--surface-pop)] px-4 py-2">
              1 to 48 pages
            </span>
            <span className="rounded-full bg-[var(--surface-pop)] px-4 py-2">
              12, 24, 36, or 48 colors
            </span>
            <span className="rounded-full bg-[var(--surface-pop)] px-4 py-2">
              20 to 46 hexes wide
            </span>
          </div>
          <div className="mt-6">
            <Link className="primary-button inline-flex" href="/custom-order">
              {product.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
