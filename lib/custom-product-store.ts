import { promises as fs } from "node:fs";
import path from "node:path";
import { getDefaultProductGradient } from "@/lib/product-assets";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import {
  CUSTOM_PRODUCT_PAGE_COUNTS,
  type CustomProduct,
  type CustomProductInput,
  type CustomProductPagePrice,
  type CustomProductRecord,
  type ProductImage,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const customProductPath = path.join(dataDirectory, "custom-product.json");
const defaultSlug = "custom-photo-pattern";

const defaultPagePrices = CUSTOM_PRODUCT_PAGE_COUNTS.map((pageCount) => ({
  pageCount,
  stripePriceId: "",
  unitAmount: null,
  currency: "usd",
})) satisfies CustomProductPagePrice[];

const defaultCustomProduct: CustomProduct = {
  slug: defaultSlug,
  name: "Custom Photo Pattern",
  tagline: "Upload a photo or PDF and we will turn it into a custom hex pattern.",
  description:
    "Choose your page count, color count, and width, upload your image or PDF, and we will create a custom pattern for your order.",
  category: "Custom order",
  featuredEyebrow: "Custom keepsake",
  featuredTitle: "Turn your own photo into a custom coloring pattern.",
  featuredDescription:
    "Choose the page count that fits your project, select your color count and width, then upload your image or PDF for a handcrafted custom order.",
  ctaLabel: "Start custom order",
  gradient: getDefaultProductGradient(),
  active: true,
  listingImagePath: "",
  images: [],
  pagePrices: defaultPagePrices,
};

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(customProductPath);
  } catch {
    await fs.writeFile(customProductPath, JSON.stringify(defaultCustomProduct, null, 2), "utf8");
  }
}

async function readFallbackFile() {
  await ensureDataFile();
  const file = await fs.readFile(customProductPath, "utf8");
  return JSON.parse(file) as CustomProductInput;
}

async function writeFallbackFile(value: CustomProduct) {
  await ensureDataFile();
  await fs.writeFile(customProductPath, JSON.stringify(value, null, 2), "utf8");
}

function normalizeImages(images: ProductImage[]) {
  return images
    .map((image) => ({
      path: image.path.trim(),
      alt: image.alt.trim(),
    }))
    .filter((image) => image.path);
}

function normalizePagePrices(
  prices: CustomProductPagePrice[] | undefined,
  existing: Map<number, CustomProductPagePrice> = new Map(),
) {
  return CUSTOM_PRODUCT_PAGE_COUNTS.map((pageCount) => {
    const configured = prices?.find((entry) => Number(entry.pageCount) === pageCount);
    const previous = existing.get(pageCount);

    return {
      pageCount,
      stripePriceId: configured?.stripePriceId?.trim() ?? previous?.stripePriceId ?? "",
      unitAmount: Math.max(
        0,
        Number(
          configured?.unitAmount ??
            previous?.unitAmount ??
            0,
        ) || 0,
      ),
      currency:
        configured?.currency?.trim().toLowerCase() ??
        previous?.currency ??
        "usd",
    } satisfies CustomProductPagePrice;
  });
}

function normalizeCustomProduct(
  input: CustomProductInput,
  existing?: CustomProduct,
): CustomProduct {
  const images = normalizeImages(input.images ?? []);
  const listingImagePath =
    images.some((image) => image.path === input.listingImagePath)
      ? input.listingImagePath.trim()
      : (images[0]?.path ?? "");
  const existingPrices = new Map((existing?.pagePrices ?? []).map((entry) => [entry.pageCount, entry]));

  return {
    slug: defaultSlug,
    name: input.name.trim() || defaultCustomProduct.name,
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    category: input.category.trim() || defaultCustomProduct.category,
    featuredEyebrow: input.featuredEyebrow.trim() || defaultCustomProduct.featuredEyebrow,
    featuredTitle: input.featuredTitle.trim() || defaultCustomProduct.featuredTitle,
    featuredDescription:
      input.featuredDescription.trim() || defaultCustomProduct.featuredDescription,
    ctaLabel: input.ctaLabel.trim() || defaultCustomProduct.ctaLabel,
    gradient: input.gradient.trim() || getDefaultProductGradient(),
    active: Boolean(input.active),
    listingImagePath,
    images,
    pagePrices: normalizePagePrices(input.pagePrices, existingPrices),
  };
}

function productFromRecord(record: CustomProductRecord): CustomProduct {
  return normalizeCustomProduct({
    slug: record.slug,
    name: record.name,
    tagline: record.tagline,
    description: record.description,
    category: record.category,
    featuredEyebrow: record.featured_eyebrow,
    featuredTitle: record.featured_title,
    featuredDescription: record.featured_description,
    ctaLabel: record.cta_label,
    gradient: record.gradient,
    active: record.active,
    listingImagePath: record.listing_image_path,
    images: record.images ?? [],
    pagePrices: record.page_prices ?? [],
  });
}

function productToRecord(product: CustomProduct): CustomProductRecord {
  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    category: product.category,
    featured_eyebrow: product.featuredEyebrow,
    featured_title: product.featuredTitle,
    featured_description: product.featuredDescription,
    cta_label: product.ctaLabel,
    gradient: product.gradient,
    active: product.active,
    listing_image_path: product.listingImagePath,
    images: product.images,
    page_prices: product.pagePrices,
  };
}

export async function getCustomProduct() {
  if (hasSupabaseDatabaseEnv()) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("custom_products")
        .select("*")
        .eq("slug", defaultSlug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return defaultCustomProduct;
      }

      return productFromRecord(data as CustomProductRecord);
    } catch {
      return normalizeCustomProduct(await readFallbackFile());
    }
  }

  return normalizeCustomProduct(await readFallbackFile());
}

export async function saveCustomProduct(input: CustomProductInput) {
  const existing = await getCustomProduct();
  const normalized = normalizeCustomProduct(input, existing);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_products")
      .upsert(productToRecord(normalized), { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      throw new Error(`Unable to save custom product: ${error.message}`);
    }

    return productFromRecord(data as CustomProductRecord);
  }

  await writeFallbackFile(normalized);
  return normalized;
}

export async function updateCustomProductImages(images: ProductImage[]) {
  const product = await getCustomProduct();
  return saveCustomProduct({
    ...product,
    images,
    listingImagePath:
      images.some((image) => image.path === product.listingImagePath)
        ? product.listingImagePath
        : (images[0]?.path ?? ""),
  });
}
