"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  PRODUCT_GRADIENTS,
  getDefaultProductGradient,
  getProductImageUrl,
} from "@/lib/product-assets";
import type { Product, ProductInput, ProductVariant } from "@/lib/types";

const emptyVariant: ProductVariant = {
  id: "standard",
  name: "Standard",
  price: 5,
  stripePriceId: "",
  pageCount: 1,
  downloads: [],
};

const emptyForm: ProductInput = {
  name: "",
  slug: "",
  description: "",
  price: emptyVariant.price,
  stripePriceId: emptyVariant.stripePriceId,
  category: "",
  pageCount: emptyVariant.pageCount,
  tagline: "",
  gradient: getDefaultProductGradient(),
  audience: [],
  features: [],
  featured: false,
  listingImagePath: "",
  images: [],
  downloads: [],
  variants: [emptyVariant],
};

function toTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeVariantId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createVariantDraft(index: number): ProductVariant {
  return {
    ...emptyVariant,
    id: `variant-${index + 1}`,
    name: `Variant ${index + 1}`,
  };
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
    listingImagePath: product.listingImagePath,
    images: product.images,
    downloads: product.downloads,
    variants: product.variants,
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
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialProducts[0]?.variants[0]?.id ?? emptyVariant.id,
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
  const selectedVariant =
    form.variants.find((variant) => variant.id === selectedVariantId) ?? form.variants[0];

  function setVariants(nextVariants: ProductVariant[]) {
    setForm((current) => {
      const variants = nextVariants.length > 0 ? nextVariants : [createVariantDraft(0)];
      const primaryVariant = variants[0];

      return {
        ...current,
        variants,
        price: primaryVariant.price,
        stripePriceId: primaryVariant.stripePriceId,
        pageCount: primaryVariant.pageCount,
        downloads: primaryVariant.downloads,
      };
    });
    setSelectedVariantId((current) => {
      return nextVariants.some((variant) => variant.id === current)
        ? current
        : (nextVariants[0]?.id ?? createVariantDraft(0).id);
    });
  }

  function updateVariant(
    variantId: string,
    updater: (variant: ProductVariant) => ProductVariant,
  ) {
    setVariants(
      form.variants.map((variant) => {
        return variant.id === variantId ? updater(variant) : variant;
      }),
    );
  }

  function loadProduct(product: Product) {
    setSelectedSlug(product.slug);
    setForm(fromProduct(product));
    setAudienceText(product.audience.join(", "));
    setFeaturesText(product.features.join(", "));
    setSelectedVariantId(product.variants[0]?.id ?? emptyVariant.id);
    setImageAlt("");
    setDownloadLabel("");
    setStatus("");
    setError("");
  }

  function syncProduct(saved: Product, previousSlug = selectedSlug) {
    setProducts((current) => {
      const next = [...current.filter((product) => product.slug !== previousSlug), saved].sort(
        (left, right) => left.name.localeCompare(right.name),
      );

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
    setSelectedVariantId(emptyVariant.id);
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
      listingImagePath: form.listingImagePath,
      images: selectedProduct?.images ?? form.images,
      downloads: form.variants[0]?.downloads ?? [],
      price: form.variants[0]?.price ?? 0,
      stripePriceId: form.variants[0]?.stripePriceId ?? "",
      pageCount: form.variants[0]?.pageCount ?? 1,
      variants: form.variants.map((variant, index) => ({
        ...variant,
        id: normalizeVariantId(variant.id) || `variant-${index + 1}`,
      })),
    };

    try {
      const isEdit = products.some((product) => product.slug === selectedSlug);
      const endpoint = isEdit ? `/api/admin/products/${selectedSlug}` : "/api/admin/products";
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
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.");
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

      const nextProducts = products.filter((product) => product.slug !== selectedProduct.slug);
      setProducts(nextProducts);
      if (nextProducts[0]) {
        loadProduct(nextProducts[0]);
      } else {
        resetEditor();
      }
      setStatus("Product deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product.");
    } finally {
      setIsPending(false);
    }
  }

  async function uploadAsset(assetType: "image" | "download", file: File, metadataValue: string) {
    const slug = form.slug.trim();

    if (!slug || !selectedProduct) {
      setError("Save the product before uploading images or downloads.");
      return;
    }

    if (assetType === "download" && !selectedVariant) {
      setError("Choose a variant before uploading its download zip.");
      return;
    }

    const formData = new FormData();
    formData.append("type", assetType);
    formData.append("file", file);

    if (assetType === "image") {
      formData.append("alt", metadataValue);
      setIsUploadingImage(true);
    } else {
      formData.append("label", metadataValue);
      formData.append("variantId", selectedVariant.id);
      setIsUploadingDownload(true);
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
      setStatus(assetType === "image" ? "Product image uploaded." : "Variant zip uploaded.");
      if (assetType === "image") {
        setImageAlt("");
      } else {
        setDownloadLabel("");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload asset.");
    } finally {
      setIsUploadingImage(false);
      setIsUploadingDownload(false);
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
        await uploadAsset("image", file, imageAlt);
      }

      setStatus(
        files.length === 1 ? "Product image uploaded." : `${files.length} product images uploaded.`,
      );
      setImageAlt("");
    } catch (batchError) {
      setError(
        batchError instanceof Error ? batchError.message : "Unable to upload product images.",
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
        body: JSON.stringify({
          type,
          path,
          variantId: type === "download" ? selectedVariant?.id : undefined,
        }),
      });

      const payload = (await response.json()) as Product & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete asset.");
      }

      syncProduct(payload, payload.slug);
      setStatus(type === "image" ? "Product image removed." : "Variant zip removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to delete asset.");
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
            <h2 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">Products</h2>
          </div>
          <button className="secondary-button" onClick={() => resetEditor()} type="button">
            New product
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <button
              key={product.slug}
              className={`w-full rounded-[1.4rem] px-4 py-4 text-left ${
                product.slug === selectedSlug ? "bg-[var(--surface-pop)]" : "bg-white/70"
              }`}
              onClick={() => resetEditor(product)}
              type="button"
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
            Category
            <input
              className="field"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Featured
            <select
              className="field"
              value={form.featured ? "yes" : "no"}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.value === "yes" })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Tagline
            <input
              className="field"
              value={form.tagline}
              onChange={(event) => setForm({ ...form, tagline: event.target.value })}
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
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Audience
            <input
              className="field"
              placeholder="Homeschool families, Sunday school"
              value={audienceText}
              onChange={(event) => setAudienceText(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            Features
            <input
              className="field"
              placeholder="Printable pages, memory prompts"
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
            />
          </label>
        </div>

        <section className="mt-6 rounded-[1.5rem] bg-white/70 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--brand-ink)]">Variants</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each variant has its own page count, price, Stripe price ID, and downloadable zip.
              </p>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                const nextVariant = createVariantDraft(form.variants.length);
                setVariants([...form.variants, nextVariant]);
                setSelectedVariantId(nextVariant.id);
              }}
              type="button"
            >
              Add variant
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {form.variants.map((variant) => (
              <button
                key={variant.id}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  variant.id === selectedVariantId
                    ? "bg-[var(--brand-ink)] text-white"
                    : "bg-[var(--surface-pop)] text-[var(--brand-ink)]"
                }`}
                onClick={() => setSelectedVariantId(variant.id)}
                type="button"
              >
                {variant.name}
              </button>
            ))}
          </div>

          {selectedVariant ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Variant name
                <input
                  className="field"
                  value={selectedVariant.name}
                  onChange={(event) =>
                    updateVariant(selectedVariant.id, (variant) => ({
                      ...variant,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Variant ID
                <input
                  className="field"
                  value={selectedVariant.id}
                  onChange={(event) =>
                    updateVariant(selectedVariant.id, (variant) => ({
                      ...variant,
                      id: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Price
                <input
                  className="field"
                  min="0"
                  step="0.01"
                  type="number"
                  value={selectedVariant.price}
                  onChange={(event) =>
                    updateVariant(selectedVariant.id, (variant) => ({
                      ...variant,
                      price: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Page count
                <input
                  className="field"
                  min="1"
                  type="number"
                  value={selectedVariant.pageCount}
                  onChange={(event) =>
                    updateVariant(selectedVariant.id, (variant) => ({
                      ...variant,
                      pageCount: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                Stripe price ID
                <input
                  className="field"
                  placeholder="price_123"
                  value={selectedVariant.stripePriceId}
                  onChange={(event) =>
                    updateVariant(selectedVariant.id, (variant) => ({
                      ...variant,
                      stripePriceId: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  className="secondary-button"
                  disabled={form.variants.length === 1}
                  onClick={() => {
                    const nextVariants = form.variants.filter(
                      (variant) => variant.id !== selectedVariant.id,
                    );
                    setVariants(nextVariants);
                  }}
                  type="button"
                >
                  Remove this variant
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-6 space-y-6">
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
                        <label className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                          <input
                            checked={form.listingImagePath === image.path}
                            name="listing-image"
                            onChange={() =>
                              setForm((current) => ({
                                ...current,
                                listingImagePath: image.path,
                              }))
                            }
                            type="radio"
                          />
                          Use as listing thumbnail
                        </label>
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
            <h3 className="text-lg font-black text-[var(--brand-ink)]">Variant download zip</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload the zip customers should receive for the selected variant.
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
                disabled={!selectedProduct || !selectedVariant || isUploadingDownload}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
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
              {selectedVariant?.downloads.length ? (
                selectedVariant.downloads.map((download) => (
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
                  Upload a zip after the product is saved. Each variant keeps its own download list.
                </p>
              )}
            </div>
          </section>
        </div>

        {(status || error) && (
          <div className="mt-6 space-y-2">
            {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          </div>
        )}

        <div className="mt-6">
          <button className="primary-button" disabled={isPending} onClick={saveProduct} type="button">
            {isPending ? "Saving..." : "Save product"}
          </button>
        </div>
      </div>
    </section>
  );
}
