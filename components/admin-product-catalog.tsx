"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product, VariantPricing } from "@/lib/types";

function getVariantHeading(pageCount: number) {
  return `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
}

export function AdminProductCatalog({
  initialProducts,
  initialVariantPricing,
}: {
  initialProducts: Product[];
  initialVariantPricing: VariantPricing[];
}) {
  const [products] = useState(
    [...initialProducts].sort((left, right) => left.name.localeCompare(right.name)),
  );
  const [variantPricing, setVariantPricing] = useState(initialVariantPricing);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  async function saveVariantPricing() {
    setIsSavingPricing(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variantPricing }),
      });

      const payload = (await response.json()) as { variantPricing?: VariantPricing[]; error?: string };

      if (!response.ok || !payload.variantPricing) {
        throw new Error(payload.error ?? "Unable to save variant pricing.");
      }

      setVariantPricing(payload.variantPricing);
      setStatus("Global variant pricing saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save variant pricing.",
      );
    } finally {
      setIsSavingPricing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
          Product admin
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[var(--brand-ink)] sm:text-5xl">
              Products live on their own routes now.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              Use this catalog as the jumping-off point, then open a dedicated route for each
              product instead of editing everything in one crowded panel.
            </p>
          </div>
          <Link className="primary-button" href="/admin/products/new">
            New product
          </Link>
        </div>
      </section>

      <section className="card-surface rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-mint)]">
              Global variant pricing
            </p>
            <h3 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">
              Shared prices for every product
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These six prices control the page-count variants shown across the whole store.
            </p>
          </div>
          <button
            className="primary-button"
            disabled={isSavingPricing}
            onClick={saveVariantPricing}
            type="button"
          >
            {isSavingPricing ? "Saving prices..." : "Save prices"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {variantPricing.map((entry, index) => (
            <label key={entry.pageCount} className="grid gap-2 text-sm font-bold text-slate-700">
              {getVariantHeading(entry.pageCount)}
              <input
                className="field"
                min="0"
                step="0.01"
                type="number"
                value={entry.price}
                onChange={(event) =>
                  setVariantPricing((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, price: Math.max(0, Number(event.target.value) || 0) }
                        : item,
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>

        {(status || error) && (
          <div className="mt-5 space-y-2">
            {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          </div>
        )}
      </section>

      <section className="card-surface rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Catalog
            </p>
            <h3 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">Open a product</h3>
          </div>
          <p className="text-sm font-bold text-slate-500">{products.length} total products</p>
        </div>

        <div className="mt-5 grid gap-3">
          {products.map((product) => (
            <Link
              key={product.slug}
              className="rounded-[1.4rem] bg-white/70 px-4 py-4 transition-colors hover:bg-white"
              href={`/admin/products/${product.slug}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-[var(--brand-ink)]">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.slug}</p>
                </div>
                <span className="text-right text-sm font-black text-[var(--brand-ink)]">
                  From ${Math.min(...product.variants.map((variant) => variant.price)).toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
