"use client";

import { useMemo, useState } from "react";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { getCustomOrderFileAccept } from "@/lib/custom-order-assets";
import { getProductImageUrl } from "@/lib/product-assets";
import {
  CUSTOM_PRODUCT_COLOR_COUNTS,
  CUSTOM_PRODUCT_HEX_WIDTH_MAX,
  CUSTOM_PRODUCT_HEX_WIDTH_MIN,
  type CustomProduct,
} from "@/lib/types";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return "Price coming soon";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function CustomProductClient({ product }: { product: CustomProduct }) {
  const pagePrices = product.pagePrices;
  const [pageCount, setPageCount] = useState<number>(pagePrices[0]?.pageCount ?? 1);
  const [colorCount, setColorCount] = useState<number>(CUSTOM_PRODUCT_COLOR_COUNTS[0]);
  const [hexWidth, setHexWidth] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [acknowledgement, setAcknowledgement] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const selectedPagePrice = useMemo(
    () => pagePrices.find((entry) => entry.pageCount === pageCount) ?? pagePrices[0],
    [pagePrices, pageCount],
  );
  const galleryImages = product.images
    .map((image) => ({
      path: image.path,
      src: getProductImageUrl(image.path),
      alt: image.alt,
    }))
    .filter((image) => image.src);

  async function handleCheckout() {
    if (!file) {
      setError("Upload your photo or PDF before checkout.");
      return;
    }

    if (!acknowledgement) {
      setError("Please confirm that you have permission to use this image.");
      return;
    }

    if (!selectedPagePrice?.stripePriceId) {
      setError("This page count is not available yet.");
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("pageCount", String(pageCount));
      formData.set("colorCount", String(colorCount));
      formData.set("hexWidth", String(hexWidth));
      formData.set("acknowledgement", String(acknowledgement));
      formData.set("file", file);

      const response = await fetch("/api/custom-orders/checkout", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setIsPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <div className="card-surface overflow-hidden rounded-[2rem] p-4 sm:p-5">
        <div className="mb-4 px-2 pt-2">
          <div className="rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            {product.category}
          </div>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
            {product.tagline}
          </p>
          <h1 className="section-title mt-2 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            {product.description}
          </p>
        </div>
        {galleryImages.length > 0 ? (
          <ProductImageGallery images={galleryImages} />
        ) : (
          <div className="min-h-[380px] rounded-[2rem]" style={{ background: product.gradient }} />
        )}
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
          Custom order
        </p>
        <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
          {formatPrice(selectedPagePrice?.unitAmount ?? null, selectedPagePrice?.currency ?? null)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pricing is based on page count. Color count and width do not change the price.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Pages</span>
            <select
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setPageCount(Number(event.target.value))}
              value={pageCount}
            >
              {pagePrices.map((entry) => (
                <option key={entry.pageCount} value={entry.pageCount}>
                  {entry.pageCount} {entry.pageCount === 1 ? "page" : "pages"}
                </option>
              ))}
            </select>
            {!selectedPagePrice?.stripePriceId ? (
              <span className="text-sm font-bold text-amber-700">
                This page count is not configured in Stripe yet.
              </span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Colors</span>
            <select
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setColorCount(Number(event.target.value))}
              value={colorCount}
            >
              {CUSTOM_PRODUCT_COLOR_COUNTS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry} colors
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Hexes wide</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              max={CUSTOM_PRODUCT_HEX_WIDTH_MAX}
              min={CUSTOM_PRODUCT_HEX_WIDTH_MIN}
              onChange={(event) => setHexWidth(Number(event.target.value))}
              type="number"
              value={hexWidth}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Upload your file</span>
            <input
              accept={getCustomOrderFileAccept()}
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className="text-sm text-slate-600">
              PDF, JPG, PNG, WEBP, HEIC, and HEIF supported up to 25 MB.
            </span>
          </label>

          <label className="flex gap-3 rounded-[1rem] bg-[var(--surface-pop)] px-4 py-4 text-sm leading-6 text-slate-700">
            <input
              checked={acknowledgement}
              className="mt-1 h-4 w-4"
              onChange={(event) => setAcknowledgement(event.target.checked)}
              type="checkbox"
            />
            <span>I confirm that I own this image or have permission to use it.</span>
          </label>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-white/75 px-4 py-4">
          <h2 className="text-base font-black text-[var(--brand-ink)]">What happens next</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            <li>• Your file is uploaded securely before Stripe checkout.</li>
            <li>• After payment, the order appears in your account under My Orders.</li>
            <li>• We review the file, create the custom pattern, and update its status.</li>
            <li>• When it is ready, you will get an email and can download the finished files from your account.</li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            className="primary-button w-full"
            disabled={isPending || pagePrices.length === 0 || !selectedPagePrice?.stripePriceId}
            onClick={handleCheckout}
            type="button"
          >
            {isPending ? "Opening Stripe checkout..." : "Upload and continue to checkout"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
