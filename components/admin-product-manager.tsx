"use client";

import { useMemo, useState } from "react";
import type { Product, ProductInput } from "@/lib/types";

const emptyForm: ProductInput = {
  name: "",
  slug: "",
  description: "",
  price: 5,
  stripePriceId: "",
  category: "",
  pageCount: 1,
  tagline: "",
  emoji: "🎨",
  gradient: "linear-gradient(135deg, #ffb400, #e533b6 34%, #1f98ee 68%, #5020a4)",
  audience: [],
  features: [],
  featured: false,
};

function toTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fromProduct(product: Product): ProductInput {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stripePriceId: product.stripePriceId,
    category: product.category,
    pageCount: product.pageCount,
    tagline: product.tagline,
    emoji: product.emoji,
    gradient: product.gradient,
    audience: product.audience,
    features: product.features,
    featured: product.featured,
  };
}

export function AdminProductManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedSlug, setSelectedSlug] = useState(initialProducts[0]?.slug ?? "");
  const [form, setForm] = useState<ProductInput>(
    initialProducts[0] ? fromProduct(initialProducts[0]) : emptyForm,
  );
  const [audienceText, setAudienceText] = useState(
    initialProducts[0]?.audience.join(", ") ?? "",
  );
  const [featuresText, setFeaturesText] = useState(
    initialProducts[0]?.features.join(", ") ?? "",
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === selectedSlug),
    [products, selectedSlug],
  );

  function loadProduct(product: Product) {
    setSelectedSlug(product.slug);
    setForm(fromProduct(product));
    setAudienceText(product.audience.join(", "));
    setFeaturesText(product.features.join(", "));
    setStatus("");
    setError("");
  }

  async function saveProduct() {
    setIsPending(true);
    setStatus("");
    setError("");

    const payload: ProductInput = {
      ...form,
      audience: toTextList(audienceText),
      features: toTextList(featuresText),
    };

    try {
      const isEdit = products.some((product) => product.slug === selectedSlug);
      const endpoint = isEdit
        ? `/api/admin/products/${selectedSlug}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const saved = (await response.json()) as Product & { error?: string };

      if (!response.ok) {
        throw new Error(saved.error ?? "Unable to save product.");
      }

      setProducts((current) => {
        const others = current.filter((product) => product.slug !== selectedSlug);
        return [...others, saved].sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      });
      loadProduct(saved);
      setStatus("Product saved to data/products.json.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save product.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function removeProduct() {
    if (!selectedProduct) {
      return;
    }

    setIsPending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.slug}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete product.");
      }

      const nextProducts = products.filter(
        (product) => product.slug !== selectedProduct.slug,
      );
      setProducts(nextProducts);
      setSelectedSlug(nextProducts[0]?.slug ?? "");
      if (nextProducts[0]) {
        loadProduct(nextProducts[0]);
      } else {
        setForm(emptyForm);
        setAudienceText("");
        setFeaturesText("");
      }
      setStatus("Product removed from local JSON.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="card-surface rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
              Catalog
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">
              Products
            </h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedSlug("");
              setForm(emptyForm);
              setAudienceText("");
              setFeaturesText("");
              setStatus("");
              setError("");
            }}
            type="button"
          >
            New product
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <button
              key={product.slug}
              className={`w-full rounded-[1.4rem] px-4 py-4 text-left ${
                product.slug === selectedSlug
                  ? "bg-[var(--surface-pop)]"
                  : "bg-white/70"
              }`}
              onClick={() => loadProduct(product)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-[var(--brand-ink)]">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.slug}</p>
                </div>
                <span className="text-lg font-black text-[var(--brand-ink)]">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Editor
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">
              {selectedSlug ? "Edit product" : "Create product"}
            </h2>
          </div>
          {selectedProduct ? (
            <button className="secondary-button" onClick={removeProduct} type="button">
              Delete
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Name
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Slug
            <input
              className="field"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Price
            <input
              className="field"
              min="1"
              step="0.01"
              type="number"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: Number(event.target.value) })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Stripe price ID
            <input
              className="field"
              placeholder="price_123"
              value={form.stripePriceId}
              onChange={(event) =>
                setForm({ ...form, stripePriceId: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Category
            <input
              className="field"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Page count
            <input
              className="field"
              min="1"
              type="number"
              value={form.pageCount}
              onChange={(event) =>
                setForm({ ...form, pageCount: Number(event.target.value) })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Tagline
            <input
              className="field"
              value={form.tagline}
              onChange={(event) =>
                setForm({ ...form, tagline: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Emoji
            <input
              className="field"
              value={form.emoji}
              onChange={(event) => setForm({ ...form, emoji: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Gradient
            <input
              className="field"
              value={form.gradient}
              onChange={(event) =>
                setForm({ ...form, gradient: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Description
            <textarea
              className="field min-h-28"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Audience
            <input
              className="field"
              placeholder="Kids ministry, Homeschool, Family devotions"
              value={audienceText}
              onChange={(event) => setAudienceText(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Features
            <input
              className="field"
              placeholder="Printable PDF, Scripture prompts, Bold kid-friendly lines"
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700 sm:col-span-2">
            <input
              checked={form.featured}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.checked })
              }
              type="checkbox"
            />
            Mark as featured on the homepage
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="primary-button" disabled={isPending} onClick={saveProduct} type="button">
            {isPending ? "Saving..." : "Save product"}
          </button>
          {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
