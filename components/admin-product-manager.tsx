"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  PRODUCT_GRADIENTS,
  getDefaultProductGradient,
  getProductImageUrl,
} from "@/lib/product-assets";
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
  gradient: getDefaultProductGradient(),
  audience: [],
  features: [],
  featured: false,
  images: [],
  downloads: [],
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
    gradient: product.gradient,
    audience: product.audience,
    features: product.features,
    featured: product.featured,
    images: product.images,
    downloads: product.downloads,
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
  const [imageAlt, setImageAlt] = useState("");
  const [downloadLabel, setDownloadLabel] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingDownload, setIsUploadingDownload] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === selectedSlug),
    [products, selectedSlug],
  );

  function loadProduct(product: Product) {
    setSelectedSlug(product.slug);
    setForm(fromProduct(product));
    setAudienceText(product.audience.join(", "));
    setFeaturesText(product.features.join(", "));
    setImageAlt("");
    setDownloadLabel("");
    setStatus("");
    setError("");
  }

  function syncProduct(saved: Product, previousSlug = selectedSlug) {
    setProducts((current) => {
      const next = [
        ...current.filter((product) => product.slug !== previousSlug),
        saved,
      ].sort((left, right) => left.name.localeCompare(right.name));

      return next;
    });
    loadProduct(saved);
  }

  function resetEditor(product?: Product) {
    if (product) {
      loadProduct(product);
      return;
    }

    setSelectedSlug("");
    setForm(emptyForm);
    setAudienceText("");
    setFeaturesText("");
    setImageAlt("");
    setDownloadLabel("");
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
      images: selectedProduct?.images ?? form.images,
      downloads: selectedProduct?.downloads ?? form.downloads,
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

      syncProduct(saved, selectedSlug);
      setStatus("Product saved.");
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
      if (nextProducts[0]) {
        loadProduct(nextProducts[0]);
      } else {
        resetEditor();
      }
      setStatus("Product deleted.");
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

  async function uploadAsset(
    assetType: "image" | "download",
    file: File,
    metadataValue: string,
    options?: {
      managePendingState?: boolean;
    },
  ) {
    const slug = form.slug.trim();

    if (!slug || !selectedProduct) {
      setError("Save the product before uploading images or downloads.");
      return;
    }

    const formData = new FormData();
    formData.append("type", assetType);
    formData.append("file", file);

    const managePendingState = options?.managePendingState ?? true;

    if (assetType === "image" && managePendingState) {
      formData.append("alt", metadataValue);
      setIsUploadingImage(true);
    } else if (assetType === "image") {
      formData.append("alt", metadataValue);
    } else if (managePendingState) {
      formData.append("label", metadataValue);
      setIsUploadingDownload(true);
    } else {
      formData.append("label", metadataValue);
    }

    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${slug}/assets`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as Product & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload asset.");
      }

      syncProduct(payload, payload.slug);
      setStatus(
        assetType === "image" ? "Product image uploaded." : "Download uploaded.",
      );
      if (assetType === "image") {
        setImageAlt("");
      } else {
        setDownloadLabel("");
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload asset.",
      );
    } finally {
      if (managePendingState) {
        setIsUploadingImage(false);
        setIsUploadingDownload(false);
      }
    }
  }

  async function uploadImageBatch(fileList: FileList) {
    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    setIsUploadingImage(true);
    setStatus("");
    setError("");

      try {
      for (const file of files) {
        await uploadAsset("image", file, imageAlt, {
          managePendingState: false,
        });
      }

      setStatus(
        files.length === 1
          ? "Product image uploaded."
          : `${files.length} product images uploaded.`,
      );
      setImageAlt("");
    } catch (batchError) {
      setError(
        batchError instanceof Error
          ? batchError.message
          : "Unable to upload product images.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function removeAsset(type: "image" | "download", path: string) {
    if (!selectedProduct) {
      return;
    }

    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.slug}/assets`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, path }),
      });

      const payload = (await response.json()) as Product & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete asset.");
      }

      syncProduct(payload, payload.slug);
      setStatus(type === "image" ? "Product image removed." : "Download removed.");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to delete asset.",
      );
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
            onClick={() => resetEditor()}
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
              onClick={() => resetEditor(product)}
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
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Tagline
            <input
              className="field"
              value={form.tagline}
              onChange={(event) =>
                setForm({ ...form, tagline: event.target.value })
              }
            />
          </label>
          <div className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Gradient
            <div className="grid gap-3 sm:grid-cols-3">
              {PRODUCT_GRADIENTS.map((gradient) => {
                const isSelected = form.gradient === gradient;

                return (
                  <button
                    key={gradient}
                    className={`h-20 rounded-[1.25rem] border-2 ${
                      isSelected ? "border-[var(--brand-ink)]" : "border-white/80"
                    }`}
                    onClick={() => setForm({ ...form, gradient })}
                    style={{ background: gradient }}
                    type="button"
                  >
                    <span className="sr-only">Choose gradient swatch</span>
                  </button>
                );
              })}
            </div>
          </div>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
            <h3 className="text-lg font-black text-[var(--brand-ink)]">Product images</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload one or more product images to display before purchase.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="field"
                placeholder="Alt text for the next upload"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
              />
              <input
                className="field"
                disabled={!selectedProduct || isUploadingImage}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = event.target.files;

                  if (files?.length) {
                    void uploadImageBatch(files);
                  }

                  event.target.value = "";
                }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {form.images.length > 0 ? (
                form.images.map((image) => (
                  <div
                    key={image.path}
                    className="rounded-[1.2rem] border border-slate-200 bg-white p-3"
                  >
                    <Image
                      alt={image.alt || form.name}
                      className="h-32 w-full rounded-[1rem] object-cover"
                      height={128}
                      src={getProductImageUrl(image.path)}
                      unoptimized
                      width={320}
                    />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--brand-ink)]">
                          {image.alt || form.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{image.path}</p>
                      </div>
                      <button
                        className="secondary-button"
                        onClick={() => void removeAsset("image", image.path)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Save the product, then upload images from your Supabase bucket.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
            <h3 className="text-lg font-black text-[var(--brand-ink)]">Customer downloads</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload one or more digital files that paying customers can download.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="field"
                placeholder="Download label for the next upload"
                value={downloadLabel}
                onChange={(event) => setDownloadLabel(event.target.value)}
              />
              <input
                className="field"
                disabled={!selectedProduct || isUploadingDownload}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void uploadAsset("download", file, downloadLabel);
                  }

                  event.target.value = "";
                }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {form.downloads.length > 0 ? (
                form.downloads.map((download) => (
                  <div
                    key={download.path}
                    className="rounded-[1.2rem] border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--brand-ink)]">
                          {download.label}
                        </p>
                        <p className="truncate text-xs text-slate-500">{download.path}</p>
                      </div>
                      <button
                        className="secondary-button"
                        onClick={() => void removeAsset("download", download.path)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Upload PDFs, ZIPs, or other digital files after the product is saved.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
