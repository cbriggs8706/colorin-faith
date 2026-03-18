import Link from "next/link";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_24px_60px_rgba(32,48,66,0.12)]">
      <div className="relative min-h-[220px] px-5 py-5" style={{ background: product.gradient }}>
        <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
          {product.category}
        </div>
        <div className="absolute right-5 top-5 text-5xl">{product.emoji}</div>
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
        <p className="text-sm leading-6 text-slate-600">{product.description}</p>
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
