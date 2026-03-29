import Image from "next/image";
import Link from "next/link";
import { getProductImageUrl } from "@/lib/product-assets";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  variant?: "default" | "featured";
};

function getListingImage(product: Product) {
  if (product.listingImagePath) {
    return product.images.find((image) => image.path === product.listingImagePath) ?? null;
  }

  return product.images[0] ?? null;
}

export function ProductCard({
  product,
  variant = "default",
}: ProductCardProps) {
  const listingImage = getListingImage(product);
  const isFeatured = variant === "featured";
  const sortedVariantPrices = product.variants
    .map((entry) => entry.price)
    .sort((left, right) => left - right);
  const minPrice =
    sortedVariantPrices.find((price) => price > 0) ?? sortedVariantPrices[0] ?? 0;
  const maxPageCount = Math.max(...product.variants.map((entry) => entry.pageCount));

  return (
    <Link
      className="group block rounded-[1.9rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(31,152,238,0.2)]"
      href={`/product/${product.slug}`}
    >
      <article
        className={`overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_24px_60px_rgba(32,48,66,0.12)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_28px_70px_rgba(32,48,66,0.16)] ${
          isFeatured ? "grid gap-0 lg:grid-cols-[1.15fr_0.85fr]" : ""
        }`}
      >
        <div
          className={`relative overflow-hidden ${
            isFeatured ? "min-h-[320px] lg:min-h-full" : "aspect-[4/3]"
          }`}
          style={listingImage ? undefined : { background: product.gradient }}
        >
          {listingImage ? (
            <Image
              alt={listingImage.alt || product.name}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
              fill
              src={getProductImageUrl(listingImage.path)}
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[240px] items-end p-6">
              <div className="rounded-full bg-white/88 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                {product.category}
              </div>
            </div>
          )}
        </div>

        <div className={`flex flex-col ${isFeatured ? "justify-center p-6 sm:p-8" : "p-5"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="pill-label w-fit text-[var(--brand-coral)]">{product.category}</span>
            <span className="text-2xl font-black text-[var(--brand-ink)]">
              From ${minPrice.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              {product.tagline}
            </p>
            <h2
              className={`font-extrabold text-[var(--brand-ink)] ${
                isFeatured ? "section-title text-3xl sm:text-4xl" : "section-title text-2xl"
              }`}
            >
              {product.name}
            </h2>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
            <span>Up to {maxPageCount} printable pages</span>
            <span
              className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(31,80,181,0.24)] transition duration-200 group-hover:shadow-[0_18px_36px_rgba(80,32,164,0.28)]"
              style={{ background: "var(--gradient-ribbon)" }}
            >
              View printable
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
