import Image from "next/image";
import Link from "next/link";
import { getProductImageUrl } from "@/lib/product-assets";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const heroImage = product.images[0];

  return (
    <article className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_24px_60px_rgba(32,48,66,0.12)]">
      <div className="relative min-h-[220px] px-5 py-5" style={{ background: product.gradient }}>
        {heroImage ? (
          <Image
            alt={heroImage.alt || product.name}
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-30"
            fill
            src={getProductImageUrl(heroImage.path)}
            unoptimized
          />
        ) : null}
        <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
          {product.category}
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] bg-white/78 p-4 backdrop-blur-md">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
            {product.tagline}
          </p>
          <h2 className="section-title mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
            {product.name}
          </h2>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between text-sm font-bold text-slate-600">
          <span>{product.pageCount} printable pages</span>
          <span className="text-2xl font-black text-[var(--brand-ink)]">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-3">
          <Link className="primary-button flex-1" href={`/product/${product.slug}`}>
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}
