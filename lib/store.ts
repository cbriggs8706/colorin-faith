import { promises as fs } from "node:fs";
import path from "node:path";
import {
  hasSupabaseDatabaseEnv,
} from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultProductGradient } from "@/lib/product-assets";
import type {
  Product,
  ProductDownload,
  ProductImage,
  ProductInput,
  ProductRecord,
  ProductVariant,
  SiteContent,
  SiteContentRecord,
  Subscriber,
  SubscriberRecord,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const productsPath = path.join(dataDirectory, "products.json");
const subscribersPath = path.join(dataDirectory, "subscribers.json");
const siteContentPath = path.join(dataDirectory, "site-content.json");
const siteContentKey = "homepage";

function mapSupabaseProductError(action: "save" | "update" | "delete", message: string) {
  if (
    message.includes("Could not find the 'listing_image_path' column") ||
    message.includes("Could not find the 'downloads' column") ||
    message.includes("Could not find the 'images' column") ||
    message.includes("Could not find the 'variants' column")
  ) {
    return `Unable to ${action} Supabase product: your Supabase products table is missing the latest product asset columns. Run the SQL in supabase/schema.sql (or the migration in supabase/migrations) and refresh the schema cache.`;
  }

  return `Unable to ${action} Supabase product: ${message}`;
}

async function ensureDataFiles() {
  await fs.mkdir(dataDirectory, { recursive: true });

  for (const [filePath, fallback] of [
    [productsPath, "[]"],
    [subscribersPath, "[]"],
    [siteContentPath, "{}"],
  ] as const) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, fallback, "utf8");
    }
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  await ensureDataFiles();
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await ensureDataFiles();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function normalizeVariantId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFallbackVariantId(input: {
  id?: string;
  name?: string;
  pageCount?: number;
}) {
  const fromId = normalizeVariantId(input.id ?? "");

  if (fromId) {
    return fromId;
  }

  const fromName = normalizeVariantId(input.name ?? "");

  if (fromName) {
    return fromName;
  }

  const pageCount = Number(input.pageCount ?? 0);
  return pageCount > 0 ? `${pageCount}-pages` : "standard";
}

function getDefaultVariantValues(input: {
  pageCount?: number;
  price?: number;
  stripePriceId?: string;
  downloads?: ProductDownload[];
}) {
  const pageCount = Number(input.pageCount ?? 1);
  return {
    id: getFallbackVariantId({ pageCount }),
    name: `${pageCount} pages`,
    pageCount,
    price: Number(input.price ?? 0),
    stripePriceId: String(input.stripePriceId ?? ""),
    downloads: normalizeDownloads(input.downloads ?? []),
  } satisfies ProductVariant;
}

function normalizeVariants(
  variants: ProductVariant[] | undefined,
  fallback: {
    pageCount?: number;
    price?: number;
    stripePriceId?: string;
    downloads?: ProductDownload[];
  },
) {
  const normalized = (variants ?? [])
    .map((variant) => {
      const id = getFallbackVariantId(variant);

      return {
        id,
        name: variant.name.trim() || `${Math.max(1, Number(variant.pageCount))} pages`,
        price: Number(variant.price),
        stripePriceId: variant.stripePriceId.trim(),
        pageCount: Math.max(1, Number(variant.pageCount)),
        downloads: normalizeDownloads(variant.downloads ?? []),
      } satisfies ProductVariant;
    })
    .filter((variant, index, all) => {
      return (
        variant.id &&
        Number.isFinite(variant.price) &&
        variant.price >= 0 &&
        !all.some((candidate, candidateIndex) => {
          return candidateIndex < index && candidate.id === variant.id;
        })
      );
    });

  return normalized.length > 0 ? normalized : [getDefaultVariantValues(fallback)];
}

function normalizeProduct(input: ProductInput): Product {
  if (!input.name.trim()) {
    throw new Error("Product name is required.");
  }

  if (!input.slug.trim()) {
    throw new Error("Product slug is required.");
  }

  const images = normalizeImages(input.images);
  const listingImagePath =
    images.some((image) => image.path === input.listingImagePath)
      ? input.listingImagePath.trim()
      : (images[0]?.path ?? "");
  const variants = normalizeVariants(input.variants, input);
  const defaultVariant = variants[0];

  return {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    tagline: input.tagline.trim(),
    gradient: input.gradient.trim() || getDefaultProductGradient(),
    price: defaultVariant.price,
    stripePriceId: defaultVariant.stripePriceId,
    pageCount: defaultVariant.pageCount,
    audience: input.audience.map((entry) => entry.trim()).filter(Boolean),
    features: input.features.map((entry) => entry.trim()).filter(Boolean),
    featured: Boolean(input.featured),
    listingImagePath,
    images,
    downloads: defaultVariant.downloads,
    variants,
  };
}

function normalizeImages(images: ProductImage[]) {
  return images
    .map((image) => ({
      path: image.path.trim(),
      alt: image.alt.trim(),
    }))
    .filter((image) => image.path);
}

function normalizeDownloads(downloads: ProductDownload[]) {
  return downloads
    .map((download) => ({
      path: download.path.trim(),
      label: download.label.trim(),
    }))
    .filter((download) => download.path && download.label);
}

function productFromRecord(record: ProductRecord): Product {
  const variants = normalizeVariants(record.variants, {
    pageCount: record.page_count,
    price: record.price,
    stripePriceId: record.stripe_price_id,
    downloads: record.downloads ?? [],
  });
  const defaultVariant = variants[0];

  return {
    name: record.name,
    slug: record.slug,
    description: record.description,
    price: defaultVariant.price,
    stripePriceId: defaultVariant.stripePriceId,
    category: record.category,
    pageCount: defaultVariant.pageCount,
    tagline: record.tagline,
    gradient: record.gradient,
    audience: record.audience ?? [],
    features: record.features ?? [],
    featured: Boolean(record.featured),
    listingImagePath: record.listing_image_path ?? record.images?.[0]?.path ?? "",
    images: record.images ?? [],
    downloads: defaultVariant.downloads,
    variants,
  };
}

function productToRecord(product: Product): ProductRecord {
  const defaultVariant = product.variants[0] ?? getDefaultVariantValues(product);

  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: defaultVariant.price,
    stripe_price_id: defaultVariant.stripePriceId,
    category: product.category,
    page_count: defaultVariant.pageCount,
    tagline: product.tagline,
    gradient: product.gradient,
    audience: product.audience,
    features: product.features,
    featured: product.featured,
    listing_image_path: product.listingImagePath,
    images: product.images,
    downloads: defaultVariant.downloads,
    variants: product.variants,
  };
}

function subscriberFromRecord(record: SubscriberRecord): Subscriber {
  return {
    email: record.email,
    firstName: record.first_name,
    createdAt: record.created_at,
  };
}

export async function getProducts() {
  if (hasSupabaseDatabaseEnv()) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data as ProductRecord[]).map(productFromRecord);
    } catch {
      const products = await readJsonFile<ProductInput[]>(productsPath);
      return products.map(normalizeProduct);
    }
  }

  const products = await readJsonFile<ProductInput[]>(productsPath);
  return products
    .map(normalizeProduct)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getFeaturedProducts() {
  const products = await getProducts();
  const featured = products.filter((product) => product.featured);
  return featured.length > 0 ? featured : products.slice(0, 3);
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function createProduct(input: ProductInput) {
  const product = normalizeProduct(input);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .insert(productToRecord(product))
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseProductError("save", error.message));
    }

    return productFromRecord(data as ProductRecord);
  }

  const products = await getProducts();

  if (products.some((entry) => entry.slug === product.slug)) {
    throw new Error("A product with that slug already exists.");
  }

  const nextProducts = [...products, product];
  await writeJsonFile(productsPath, nextProducts);
  return product;
}

export async function updateProduct(slug: string, input: ProductInput) {
  const product = normalizeProduct(input);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .update(productToRecord(product))
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseProductError("update", error.message));
    }

    return productFromRecord(data as ProductRecord);
  }

  const products = await getProducts();
  const target = products.find((entry) => entry.slug === slug);

  if (!target) {
    throw new Error("Product not found.");
  }

  if (slug !== product.slug && products.some((entry) => entry.slug === product.slug)) {
    throw new Error("Another product already uses that slug.");
  }

  const nextProducts = products.map((entry) => (entry.slug === slug ? product : entry));
  await writeJsonFile(productsPath, nextProducts);
  return product;
}

export async function deleteProduct(slug: string) {
  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("products").delete().eq("slug", slug);

    if (error) {
      throw new Error(mapSupabaseProductError("delete", error.message));
    }

    return;
  }

  const products = await getProducts();
  const nextProducts = products.filter((product) => product.slug !== slug);

  if (nextProducts.length === products.length) {
    throw new Error("Product not found.");
  }

  await writeJsonFile(productsPath, nextProducts);
}

export async function updateProductImages(slug: string, images: ProductImage[]) {
  const product = await getProductBySlug(slug);

  if (!product) {
    throw new Error("Product not found.");
  }

  return updateProduct(slug, {
    ...product,
    images,
  });
}

export async function updateProductVariantDownloads(
  slug: string,
  variantId: string,
  downloads: ProductDownload[],
) {
  const product = await getProductBySlug(slug);

  if (!product) {
    throw new Error("Product not found.");
  }

  const hasVariant = product.variants.some((variant) => variant.id === variantId);

  if (!hasVariant) {
    throw new Error("Variant not found.");
  }

  return updateProduct(slug, {
    ...product,
    variants: product.variants.map((variant) =>
      variant.id === variantId
        ? {
            ...variant,
            downloads,
          }
        : variant,
    ),
  });
}

export async function getSubscribers() {
  if (hasSupabaseDatabaseEnv()) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as SubscriberRecord[]).map(subscriberFromRecord);
    } catch {
      return readJsonFile<Subscriber[]>(subscribersPath);
    }
  }

  return readJsonFile<Subscriber[]>(subscribersPath);
}

export async function addSubscriber({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("subscribers").upsert(
      {
        email: normalizedEmail,
        first_name: firstName.trim(),
      },
      { onConflict: "email" },
    );

    if (error) {
      throw new Error(`Unable to save subscriber: ${error.message}`);
    }

    return { message: "Thanks! You have been added to the launch list." };
  }

  const subscribers = await getSubscribers();

  if (subscribers.some((subscriber) => subscriber.email === normalizedEmail)) {
    return { message: "You are already on the list." };
  }

  const nextSubscriber: Subscriber = {
    email: normalizedEmail,
    firstName: firstName.trim(),
    createdAt: new Date().toISOString(),
  };

  await writeJsonFile(subscribersPath, [...subscribers, nextSubscriber]);

  return { message: "Thanks! You have been added to the launch list." };
}

export async function getSiteContent() {
  if (hasSupabaseDatabaseEnv()) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", siteContentKey)
        .single();

      if (error) {
        throw error;
      }

      return (data as SiteContentRecord).value;
    } catch {
      return readJsonFile<SiteContent>(siteContentPath);
    }
  }

  return readJsonFile<SiteContent>(siteContentPath);
}
