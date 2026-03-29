"use client";

import { useMemo, useState } from "react";
import { BuyButton } from "@/components/buy-button";
import { ProductImageGallery } from "@/components/product-image-gallery";
import type { Product } from "@/lib/types";

type GalleryImage = {
  path: string;
  src: string;
  alt: string;
};

type ProductDetailClientProps = {
  product: Product;
  galleryImages: GalleryImage[];
  minPrice: number;
  maxPageCount: number;
};

function moveVariantImageFirst(images: GalleryImage[], selectedImagePath: string) {
  if (!selectedImagePath) {
    return images;
  }

  const selectedIndex = images.findIndex((image) => image.path === selectedImagePath);

  if (selectedIndex <= 0) {
    return images;
  }

  return [images[selectedIndex], ...images.slice(0, selectedIndex), ...images.slice(selectedIndex + 1)];
}

export function ProductDetailClient({
  product,
  galleryImages,
  minPrice,
  maxPageCount,
}: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const orderedGalleryImages = useMemo(
    () => moveVariantImageFirst(galleryImages, selectedVariant?.imagePath ?? ""),
    [galleryImages, selectedVariant?.imagePath],
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="card-surface overflow-hidden rounded-[2rem] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-2 pt-2">
          <div>
            <div className="rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              {product.category}
            </div>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
              {product.tagline}
            </p>
            <h1 className="section-title mt-2 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
              {product.name}
            </h1>
          </div>
        </div>
        {orderedGalleryImages.length > 0 ? (
          <ProductImageGallery
            key={selectedVariant?.id ?? "default-gallery"}
            images={orderedGalleryImages}
          />
        ) : (
          <div className="min-h-[380px] rounded-[2rem]" style={{ background: product.gradient }} />
        )}
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Instant download
            </p>
            <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
              From ${minPrice.toFixed(2)}
            </p>
          </div>
          <span className="rounded-full bg-white/75 px-3 py-2 text-sm font-bold text-slate-700">
            Up to {maxPageCount} pages
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Includes a printable PDF download for personal, classroom, or ministry
          use according to your shop policies.
        </p>
        <div className="mt-6">
          <BuyButton
            onVariantChange={setSelectedVariantId}
            product={product}
            selectedVariantId={selectedVariant?.id}
          />
        </div>
        <div className="mt-6 rounded-[1.5rem] bg-white/75 px-4 py-4">
          <h2 className="text-base font-black text-[var(--brand-ink)]">
            What&apos;s included
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {product.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
