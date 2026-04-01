"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PRODUCT_GRADIENTS, getProductImageUrl } from "@/lib/product-assets";
import type { CustomProduct, CustomProductInput, CustomProductPagePrice } from "@/lib/types";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function toCurrencyInput(amount: number | null) {
  return amount === null ? "" : (amount / 100).toFixed(2);
}

function fromCurrencyInput(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

export function AdminCustomProductManager({ initialProduct }: { initialProduct: CustomProduct }) {
  const [form, setForm] = useState<CustomProductInput>(initialProduct);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const galleryPreview = useMemo(
    () =>
      form.images.map((image) => ({
        ...image,
        src: getProductImageUrl(image.path),
      })),
    [form.images],
  );

  function updatePagePrice(pageCount: number, updater: (entry: CustomProductPagePrice) => CustomProductPagePrice) {
    setForm((current) => ({
      ...current,
      pagePrices: current.pagePrices.map((entry) =>
        entry.pageCount === pageCount ? updater(entry) : entry,
      ),
    }));
  }

  async function saveProduct() {
    setIsPending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/custom-product", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as CustomProduct & { error?: string };

      if (!response.ok || !payload.slug) {
        throw new Error(payload.error ?? "Unable to save custom product.");
      }

      setForm(payload);
      setStatus("Custom product saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save custom product.");
    } finally {
      setIsPending(false);
    }
  }

  async function uploadImage(file: File, alt: string) {
    setUploadingImage(true);
    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("alt", alt);

      const response = await fetch("/api/admin/custom-product/assets", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as CustomProduct & { error?: string };

      if (!response.ok || !payload.slug) {
        throw new Error(payload.error ?? "Unable to upload image.");
      }

      setForm(payload);
      setStatus("Gallery image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeImage(path: string) {
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/custom-product/assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
      const payload = (await response.json()) as CustomProduct & { error?: string };

      if (!response.ok || !payload.slug) {
        throw new Error(payload.error ?? "Unable to delete image.");
      }

      setForm(payload);
      setStatus("Gallery image removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to delete image.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="pill-label w-fit text-[var(--brand-berry)]">Custom product</p>
            <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)]">
              Configure the featured custom order offer
            </h1>
          </div>
          <button className="primary-button" disabled={isPending} onClick={saveProduct} type="button">
            {isPending ? "Saving..." : "Save custom product"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Product name</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              value={form.name}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Category label</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              value={form.category}
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Tagline</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
              value={form.tagline}
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Description</span>
            <textarea
              className="min-h-32 rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              value={form.description}
            />
          </label>
        </div>
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
          Homepage feature
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Eyebrow</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, featuredEyebrow: event.target.value }))}
              value={form.featuredEyebrow}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">CTA label</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
              value={form.ctaLabel}
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Featured title</span>
            <input
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, featuredTitle: event.target.value }))}
              value={form.featuredTitle}
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Featured description</span>
            <textarea
              className="min-h-28 rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) =>
                setForm((current) => ({ ...current, featuredDescription: event.target.value }))
              }
              value={form.featuredDescription}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--brand-ink)]">Gradient</span>
            <select
              className="rounded-[1rem] border border-slate-200 px-4 py-3"
              onChange={(event) => setForm((current) => ({ ...current, gradient: event.target.value }))}
              value={form.gradient}
            >
              {PRODUCT_GRADIENTS.map((gradient) => (
                <option key={gradient} value={gradient}>
                  {gradient}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-[1rem] bg-[var(--surface-pop)] px-4 py-4 text-sm font-bold text-slate-700">
            <input
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
              type="checkbox"
            />
            Offer is active on the homepage and custom order page.
          </label>
        </div>
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-mint)]">
          Gallery
        </p>
        <label className="mt-4 grid gap-2">
          <span className="text-sm font-black text-[var(--brand-ink)]">Upload image</span>
          <input
            accept="image/*"
            className="rounded-[1rem] border border-slate-200 px-4 py-3"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void uploadImage(file, form.name);
              }
            }}
            type="file"
          />
        </label>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {galleryPreview.map((image) => (
            <article key={image.path} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-slate-100">
                {image.src ? (
                  <Image alt={image.alt} className="object-cover" fill sizes="33vw" src={image.src} unoptimized />
                ) : null}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">{image.alt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={form.listingImagePath === image.path ? "primary-button px-4 py-2 text-sm" : "secondary-button px-4 py-2 text-sm"}
                  onClick={() => setForm((current) => ({ ...current, listingImagePath: image.path }))}
                  type="button"
                >
                  {form.listingImagePath === image.path ? "Listing image" : "Use as listing image"}
                </button>
                <button className="secondary-button px-4 py-2 text-sm" onClick={() => void removeImage(image.path)} type="button">
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        {uploadingImage ? <p className="mt-4 text-sm font-bold text-slate-600">Uploading image...</p> : null}
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-sky)]">
          Page pricing
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Set the visible customer price for each supported page count and keep the Stripe price ID alongside it for checkout.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {form.pagePrices.map((entry) => (
            <div key={entry.pageCount} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-[var(--brand-ink)]">
                  {entry.pageCount} {entry.pageCount === 1 ? "page" : "pages"}
                </p>
                <p className="text-sm font-bold text-slate-600">
                  {formatPrice(entry.unitAmount, entry.currency)}
                </p>
              </div>
              <input
                className="mt-3 w-full rounded-[1rem] border border-slate-200 px-4 py-3"
                onChange={(event) =>
                  updatePagePrice(entry.pageCount, (current) => ({
                    ...current,
                    stripePriceId: event.target.value,
                  }))
                }
                placeholder="Stripe price ID"
                value={entry.stripePriceId}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
                <input
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3"
                  inputMode="decimal"
                  onChange={(event) =>
                    updatePagePrice(entry.pageCount, (current) => ({
                      ...current,
                      unitAmount: fromCurrencyInput(event.target.value),
                    }))
                  }
                  placeholder="Visible price"
                  value={toCurrencyInput(entry.unitAmount)}
                />
                <input
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 uppercase"
                  maxLength={3}
                  onChange={(event) =>
                    updatePagePrice(entry.pageCount, (current) => ({
                      ...current,
                      currency: event.target.value.trim().toLowerCase() || "usd",
                    }))
                  }
                  placeholder="usd"
                  value={(entry.currency ?? "usd").toUpperCase()}
                />
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Visible to customer: {formatPrice(entry.unitAmount, entry.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {status ? <p className="text-sm font-bold text-[var(--brand-mint)]">{status}</p> : null}
    </section>
  );
}
