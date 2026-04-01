"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  PRODUCT_GRADIENTS,
  getDefaultProductGradient,
  getProductImageUrl,
} from "@/lib/product-assets";
import {
  STANDARD_VARIANT_PAGE_COUNTS,
  type Product,
  type ProductInput,
  type ProductVariant,
  type VariantPricing,
} from "@/lib/types";

function toTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildProductSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getVariantId(pageCount: number) {
  return `${pageCount}-pages`;
}

function getVariantHeading(pageCount: number) {
  return `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
}

function getPriceForPageCount(pageCount: number, pricing: VariantPricing[]) {
  return pricing.find((entry) => entry.pageCount === pageCount)?.price ?? pageCount;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

function syncVariant(pageCount: number, current: Partial<ProductVariant>, pricing: VariantPricing[]) {
  return {
    id: getVariantId(pageCount),
    name: getVariantHeading(pageCount),
    pageCount,
    price: getPriceForPageCount(pageCount, pricing),
    stripePriceId: current.stripePriceId?.trim() ?? "",
    imagePath: current.imagePath?.trim() ?? "",
    downloads: current.downloads ?? [],
  } satisfies ProductVariant;
}

function syncVariants(variants: ProductVariant[] | undefined, pricing: VariantPricing[]) {
  return STANDARD_VARIANT_PAGE_COUNTS.map((pageCount) => {
    const variant = variants?.find((entry) => entry.pageCount === pageCount);
    return syncVariant(pageCount, variant ?? {}, pricing);
  });
}

function createEmptyForm(pricing: VariantPricing[]): ProductInput {
  const variants = syncVariants([], pricing);

  return {
    name: "",
    slug: "",
    description: "",
    price: Math.min(...variants.map((variant) => variant.price)),
    stripePriceId: variants[0]?.stripePriceId ?? "",
    category: "",
    pageCount: variants[0]?.pageCount ?? 1,
    tagline: "",
    gradient: getDefaultProductGradient(),
    audience: [],
    features: [],
    relatedProducts: [],
    featured: false,
    listingImagePath: "",
    images: [],
    downloads: [],
    variants,
  };
}

function fromProduct(product: Product, pricing: VariantPricing[]): ProductInput {
  const variants = syncVariants(product.variants, pricing);

  return {
    ...product,
    price: Math.min(...variants.map((variant) => variant.price)),
    stripePriceId: variants[0]?.stripePriceId ?? "",
    pageCount: variants[0]?.pageCount ?? 1,
    downloads: variants[0]?.downloads ?? [],
    variants,
  };
}

function applyPricingToProduct(product: Product, pricing: VariantPricing[]) {
  const variants = syncVariants(product.variants, pricing);

  return {
    ...product,
    price: Math.min(...variants.map((variant) => variant.price)),
    stripePriceId: variants[0]?.stripePriceId ?? "",
    pageCount: variants[0]?.pageCount ?? 1,
    downloads: variants[0]?.downloads ?? [],
    variants,
  } satisfies Product;
}

export function AdminProductManager({
  initialProducts,
  initialVariantPricing,
}: {
  initialProducts: Product[];
  initialVariantPricing: VariantPricing[];
}) {
  const [variantPricing, setVariantPricing] = useState(initialVariantPricing);
  const [products, setProducts] = useState(
    initialProducts.map((product) => applyPricingToProduct(product, initialVariantPricing)),
  );
  const [selectedSlug, setSelectedSlug] = useState(initialProducts[0]?.slug ?? "");
  const [form, setForm] = useState<ProductInput>(
    initialProducts[0]
      ? fromProduct(initialProducts[0], initialVariantPricing)
      : createEmptyForm(initialVariantPricing),
  );
  const [audienceText, setAudienceText] = useState(
    initialProducts[0]?.audience.join(", ") ?? "",
  );
  const [featuresText, setFeaturesText] = useState(
    initialProducts[0]?.features.join(", ") ?? "",
  );
  const [relatedProductSlugs, setRelatedProductSlugs] = useState<string[]>(
    initialProducts[0]?.relatedProducts ?? [],
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);
  const [uploadingDownloadKey, setUploadingDownloadKey] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === selectedSlug),
    [products, selectedSlug],
  );
  const derivedSlug = buildProductSlug(form.name);

  function setVariants(nextVariants: ProductVariant[]) {
    const variants = syncVariants(nextVariants, variantPricing);
    const firstVariant = variants[0];

    setForm((current) => ({
      ...current,
      variants,
      price: Math.min(...variants.map((variant) => variant.price)),
      stripePriceId: firstVariant?.stripePriceId ?? "",
      pageCount: firstVariant?.pageCount ?? 1,
      downloads: firstVariant?.downloads ?? [],
    }));
  }

  function updateVariant(
    variantId: string,
    updater: (variant: ProductVariant) => ProductVariant,
  ) {
    setVariants(
      form.variants.map((variant) => (variant.id === variantId ? updater(variant) : variant)),
    );
  }

  function moveGalleryImage(imagePath: string, direction: "up" | "down") {
    setForm((current) => {
      const currentIndex = current.images.findIndex((image) => image.path === imagePath);

      if (currentIndex < 0) {
        return current;
      }

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      return {
        ...current,
        images: moveItem(current.images, currentIndex, nextIndex),
      };
    });
    setStatus("Gallery order updated. Save the product to keep it.");
    setError("");
  }

  function loadProduct(product: Product) {
    const pricedProduct = applyPricingToProduct(product, variantPricing);

    setSelectedSlug(pricedProduct.slug);
    setForm(fromProduct(pricedProduct, variantPricing));
    setAudienceText(pricedProduct.audience.join(", "));
    setFeaturesText(pricedProduct.features.join(", "));
    setRelatedProductSlugs(pricedProduct.relatedProducts);
    setStatus("");
    setError("");
  }

  function syncProduct(saved: Product, previousSlug = selectedSlug) {
    const pricedProduct = applyPricingToProduct(saved, variantPricing);

    setProducts((current) => {
      const next = [...current.filter((product) => product.slug !== previousSlug), pricedProduct];
      return next.sort((left, right) => left.name.localeCompare(right.name));
    });
    loadProduct(pricedProduct);
  }

  function resetEditor(product?: Product) {
    if (product) {
      loadProduct(product);
      return;
    }

    setSelectedSlug("");
    setForm(createEmptyForm(variantPricing));
    setAudienceText("");
    setFeaturesText("");
    setRelatedProductSlugs([]);
    setStatus("");
    setError("");
  }

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

      const nextPricing = payload.variantPricing;
      setVariantPricing(nextPricing);
      setProducts((current) => current.map((product) => applyPricingToProduct(product, nextPricing)));
      setForm((current) => {
        const variants = syncVariants(current.variants, nextPricing);
        const firstVariant = variants[0];

        return {
          ...current,
          variants,
          price: Math.min(...variants.map((variant) => variant.price)),
          stripePriceId: firstVariant?.stripePriceId ?? "",
          pageCount: firstVariant?.pageCount ?? 1,
          downloads: firstVariant?.downloads ?? [],
        };
      });
      setStatus("Global variant pricing saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save variant pricing.",
      );
    } finally {
      setIsSavingPricing(false);
    }
  }

  async function saveProduct() {
    setIsPending(true);
    setStatus("");
    setError("");

    const variants = syncVariants(form.variants, variantPricing);
    const payload: ProductInput = {
      ...form,
      slug: derivedSlug,
      audience: toTextList(audienceText),
      features: toTextList(featuresText),
      relatedProducts: relatedProductSlugs,
      listingImagePath: form.listingImagePath,
      images: form.images,
      downloads: variants[0]?.downloads ?? [],
      price: Math.min(...variants.map((variant) => variant.price)),
      stripePriceId: variants[0]?.stripePriceId ?? "",
      pageCount: variants[0]?.pageCount ?? 1,
      variants,
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

  async function uploadAsset({
    type,
    file,
    variant,
  }: {
    type: "image" | "download";
    file: File;
    variant?: ProductVariant;
  }) {
    const slug = form.slug.trim();

    if (!slug || !selectedProduct) {
      setError("Save the product before uploading images or downloads.");
      return;
    }

    if (type === "image") {
      setUploadingImageKey(variant?.id ?? "gallery");
    } else {
      setUploadingDownloadKey(variant?.id ?? "download");
    }

    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", file);

      if (type === "image") {
        formData.append(
          "alt",
          variant ? `${form.name} ${getVariantHeading(variant.pageCount)}` : form.name || file.name,
        );

        if (variant) {
          formData.append("variantId", variant.id);
        }
      } else if (variant) {
        formData.append("label", `${getVariantHeading(variant.pageCount)} ZIP`);
        formData.append("variantId", variant.id);
      }

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
        type === "image"
          ? variant
            ? `${getVariantHeading(variant.pageCount)} image uploaded.`
            : "Gallery image uploaded."
          : `${getVariantHeading(variant?.pageCount ?? 1)} zip uploaded.`,
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload asset.");
    } finally {
      setUploadingImageKey(null);
      setUploadingDownloadKey(null);
    }
  }

  async function removeAsset(type: "image" | "download", path: string, variantId?: string) {
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
          variantId,
        }),
      });
      const payload = (await response.json()) as Product & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete asset.");
      }

      syncProduct(payload, payload.slug);
      setStatus(type === "image" ? "Image removed." : "Variant zip removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to delete asset.");
    }
  }

  function toggleRelatedProduct(slug: string) {
    setRelatedProductSlugs((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
  }

  return (
    <div className="space-y-6">
      <section className="card-surface rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-mint)]">
              Global variant pricing
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">
              Shared prices for every product
            </h2>
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
      </section>

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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: buildProductSlug(event.target.value),
                  }))
                }
              />
            </label>
            <div className="grid gap-2 text-sm font-bold text-slate-700">
              <span>Slug</span>
              <div className="field bg-slate-100 text-slate-600">
                {derivedSlug || "Will be created from the product name"}
              </div>
            </div>
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
                onChange={(event) => setForm({ ...form, featured: event.target.value === "yes" })}
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
            <div className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              <span>Related products</span>
              <div className="grid gap-3 rounded-[1.2rem] bg-white/70 p-4">
                {products.filter((product) => product.slug !== selectedSlug).length > 0 ? (
                  products
                    .filter((product) => product.slug !== selectedSlug)
                    .map((product) => (
                      <label
                        key={product.slug}
                        className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3"
                      >
                        <input
                          checked={relatedProductSlugs.includes(product.slug)}
                          onChange={() => toggleRelatedProduct(product.slug)}
                          type="checkbox"
                        />
                        <span>
                          <span className="block font-black text-[var(--brand-ink)]">
                            {product.name}
                          </span>
                          <span className="block text-xs font-medium text-slate-500">
                            {product.slug}
                          </span>
                        </span>
                      </label>
                    ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    Add another product first, then you can link it here.
                  </p>
                )}
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-[1.5rem] bg-white/70 px-4 py-4">
            <h3 className="text-lg font-black text-[var(--brand-ink)]">Variants</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every product includes the standard six page-count variants. Set each variant&apos;s
              Stripe price ID, picture, and download zip here.
            </p>

            <div className="mt-5 grid gap-4">
              {form.variants.map((variant) => (
                <article
                  key={variant.id}
                  className="rounded-[1.3rem] border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-lg font-black text-[var(--brand-ink)]">
                        {getVariantHeading(variant.pageCount)}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        Global price: ${variant.price.toFixed(2)}
                      </p>
                    </div>
                    <label className="grid gap-2 text-sm font-bold text-slate-700 lg:min-w-[260px]">
                      Stripe price ID
                      <input
                        className="field"
                        placeholder="price_123"
                        value={variant.stripePriceId}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            stripePriceId: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-3 rounded-[1.1rem] bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[var(--brand-ink)]">Variant picture</p>
                        <label className="secondary-button cursor-pointer">
                          {uploadingImageKey === variant.id ? "Uploading..." : "Add picture"}
                          <input
                            className="sr-only"
                            disabled={!selectedProduct || uploadingImageKey !== null}
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];

                              if (file) {
                                void uploadAsset({ type: "image", file, variant });
                              }

                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {variant.imagePath ? (
                        <div className="space-y-3">
                          <div className="relative h-36 w-full overflow-hidden rounded-[1rem]">
                            <Image
                              alt={`${form.name} ${getVariantHeading(variant.pageCount)}`}
                              className="object-cover"
                              fill
                              sizes="(max-width: 1024px) 100vw, 30vw"
                              src={getProductImageUrl(variant.imagePath)}
                              unoptimized
                            />
                          </div>
                          <button
                            className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4"
                            onClick={() =>
                              updateVariant(variant.id, (current) => ({ ...current, imagePath: "" }))
                            }
                            type="button"
                          >
                            Use default gallery image
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Upload an image to make this variant swap the gallery when selected.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 rounded-[1.1rem] bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[var(--brand-ink)]">Variant download zip</p>
                        <label className="secondary-button cursor-pointer">
                          {uploadingDownloadKey === variant.id ? "Uploading..." : "Add ZIP"}
                          <input
                            className="sr-only"
                            disabled={!selectedProduct || uploadingDownloadKey !== null}
                            type="file"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            onChange={(event) => {
                              const file = event.target.files?.[0];

                              if (file) {
                                void uploadAsset({ type: "download", file, variant });
                              }

                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {variant.downloads.length > 0 ? (
                        variant.downloads.map((download) => (
                          <div
                            key={download.path}
                            className="rounded-[1rem] border border-slate-200 bg-white p-3"
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
                                onClick={() => void removeAsset("download", download.path, variant.id)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Upload the zip customers should receive for this page-count option.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[1.5rem] bg-white/70 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[var(--brand-ink)]">Product gallery</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Upload extra gallery images and choose which one appears on cards and listings.
                </p>
              </div>
              <label className="secondary-button cursor-pointer">
                {uploadingImageKey === "gallery" ? "Uploading..." : "Upload gallery images"}
                <input
                  className="sr-only"
                  disabled={!selectedProduct || uploadingImageKey !== null}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);

                    void (async () => {
                      for (const file of files) {
                        await uploadAsset({ type: "image", file });
                      }
                    })();

                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-4 space-y-3">
              {form.images.length > 0 ? (
                form.images.map((image) => (
                  <div
                    key={image.path}
                    className="rounded-[1.2rem] border border-slate-200 bg-white p-3"
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-[1rem]">
                      <Image
                        alt={image.alt || form.name}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 24vw"
                        src={getProductImageUrl(image.path)}
                        unoptimized
                      />
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Position {form.images.findIndex((entry) => entry.path === image.path) + 1}
                        </p>
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
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          className="secondary-button"
                          disabled={form.images[0]?.path === image.path}
                          onClick={() => moveGalleryImage(image.path, "up")}
                          type="button"
                        >
                          Move up
                        </button>
                        <button
                          className="secondary-button"
                          disabled={form.images[form.images.length - 1]?.path === image.path}
                          onClick={() => moveGalleryImage(image.path, "down")}
                          type="button"
                        >
                          Move down
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => void removeAsset("image", image.path)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
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

          {(status || error) && (
            <div className="mt-6 space-y-2">
              {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
            </div>
          )}

          <div className="mt-6">
            <button
              className="primary-button"
              disabled={isPending}
              onClick={saveProduct}
              type="button"
            >
              {isPending ? "Saving..." : "Save product"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
