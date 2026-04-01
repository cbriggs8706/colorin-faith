import { promises as fs } from "node:fs";
import path from "node:path";
import {
  hasSupabaseDatabaseEnv,
} from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultProductGradient } from "@/lib/product-assets";
import { STANDARD_VARIANT_PAGE_COUNTS } from "@/lib/types";
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
  VariantPricing,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const productsPath = path.join(dataDirectory, "products.json");
const subscribersPath = path.join(dataDirectory, "subscribers.json");
const siteContentPath = path.join(dataDirectory, "site-content.json");
const siteContentKey = "homepage";
const defaultVariantPricing = STANDARD_VARIANT_PAGE_COUNTS.map((pageCount) => ({
  pageCount,
  price: pageCount,
})) satisfies VariantPricing[];
const defaultSiteContent: SiteContent = {
  homepage: {
    shop: {
      eyebrow: "Digital shop",
      title: "Printable coloring pages for joyful, screen-free moments.",
      description:
        "Every product here is an instant digital download. Use these pages for family devotion time, Sunday school, classrooms, party tables, and everyday creative encouragement.",
      emptyState: "No products match that category yet.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "From browse to print in just a few taps.",
    },
    newsletter: {
      eyebrow: "Freebie list",
      title: "Grow your email list with a cheerful welcome freebie.",
      description:
        "Invite parents, grandparents, and ministry leaders to get early access, coupon drops, and new seasonal printable releases.",
      formHeading: "Get launch emails and a printable freebie.",
      formSubheading:
        "Join the list for new printable releases, special offers, and cheerful faith-filled freebies.",
    },
  },
  productPage: {
    aboutPrintableEyebrow: "About this printable",
    perfectForEyebrow: "Perfect for",
    afterPurchaseTitle: "After purchase",
    afterPurchaseDescription:
      "Customers are sent through secure Stripe checkout, then returned to a download page with access to the files attached to this product.",
    browseMoreLabel: "Browse more printables",
    newsletterHeading: "Want launch specials and new printable drops?",
    newsletterSubheading:
      "Invite visitors to stay in the loop while you grow your store.",
  },
  contactPage: {
    profileEyebrow: "About me",
    profileTitle: "Hi, I'm the maker behind ColorIn Faith.",
    profileDescription:
      "Use this space to share a warm introduction, your heart behind the shop, and the kinds of questions people can reach out about.",
    profileImagePath: "",
    profileImageAlt: "Portrait of the shop owner",
  },
  heroHighlight: {
    title: "Fruit of the Spirit Coloring Pack",
    description:
      "A bestselling set with joyful fruit characters, simple Scripture tie-ins, and printable pages that work beautifully for home or classroom use.",
    pages: 12,
    price: "$7",
  },
  valueProps: [
    {
      icon: "🖍️",
      title: "Instantly printable",
      description: "Customers can buy today and print right away without waiting for shipping.",
      accent: "#FFE5B5",
    },
    {
      icon: "📖",
      title: "Faith-filled themes",
      description:
        "From Bible stories to Scripture memory, every collection keeps the message front and center.",
      accent: "#CDEBFF",
    },
    {
      icon: "🎉",
      title: "Bright and playful",
      description:
        "Color palettes, shapes, and cheerful compositions feel energetic without becoming chaotic.",
      accent: "#FFD6EA",
    },
    {
      icon: "🏠",
      title: "Made for real homes",
      description:
        "Perfect for busy bags, homeschool stations, church classes, and kitchen table creativity.",
      accent: "#D7F8E5",
    },
  ],
  steps: [
    {
      title: "Pick your favorite pack",
      description:
        "Browse bright faith-based collections organized for family use, class time, and seasonal moments.",
    },
    {
      title: "Checkout with Stripe",
      description:
        "Send customers through a secure mobile-friendly Stripe checkout experience with promo code support.",
    },
    {
      title: "Deliver and print",
      description:
        "Customers complete checkout and land on a secure page where they can download the files attached to their product.",
    },
  ],
  variantPricing: defaultVariantPricing,
  faqs: [
    {
      question: "Are these physical products?",
      answer:
        "No. Every item in the shop is a digital download, so you can check out and start printing right away.",
    },
    {
      question: "How do customers receive their files?",
      answer:
        "After payment, customers are returned to a secure order-success page where the files attached to that product are available to download.",
    },
    {
      question: "Can I update products without editing code?",
      answer:
        "Yes. Admin can update product details, images, downloads, and featured settings from the dashboard.",
    },
    {
      question: "Can I collect subscriber emails?",
      answer:
        "Yes. Visitors can join your email list from the homepage and product pages to hear about new releases, promotions, and freebies.",
    },
  ],
};

function mapSupabaseProductError(action: "save" | "update" | "delete", message: string) {
  if (
    message.includes("Could not find the 'listing_image_path' column") ||
    message.includes("Could not find the 'downloads' column") ||
    message.includes("Could not find the 'images' column") ||
    message.includes("Could not find the 'variants' column") ||
    message.includes("Could not find the 'related_products' column")
  ) {
    return `Unable to ${action} Supabase product: your Supabase products table is missing the latest product asset columns. Run the SQL in supabase/schema.sql (or the migration in supabase/migrations) and refresh the schema cache.`;
  }

  return `Unable to ${action} Supabase product: ${message}`;
}

function isMissingRelatedProductsColumnError(message: string) {
  return message.includes("Could not find the 'related_products' column");
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

function normalizeProductSlug(value: string) {
  return normalizeVariantId(value);
}

function getVariantLabel(pageCount: number) {
  return `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
}

function normalizeVariantPricing(variantPricing: VariantPricing[] | undefined) {
  return STANDARD_VARIANT_PAGE_COUNTS.map((pageCount) => {
    const configured = variantPricing?.find((entry) => Number(entry.pageCount) === pageCount);

    return {
      pageCount,
      price: Math.max(0, Number(configured?.price ?? defaultVariantPricing.find((entry) => entry.pageCount === pageCount)?.price ?? pageCount)),
    } satisfies VariantPricing;
  });
}

function createVariantPricingMap(variantPricing: VariantPricing[] | undefined) {
  return new Map(
    normalizeVariantPricing(variantPricing).map((entry) => [entry.pageCount, entry.price] as const),
  );
}

function getVariantPrice(pageCount: number, variantPricingMap: Map<number, number>) {
  return variantPricingMap.get(pageCount) ?? 0;
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
  imagePath?: string;
  downloads?: ProductDownload[];
  variantPricingMap?: Map<number, number>;
}) {
  const pageCount = Number(input.pageCount ?? 1);
  return {
    id: getFallbackVariantId({ pageCount }),
    name: getVariantLabel(pageCount),
    pageCount,
    price: input.variantPricingMap
      ? getVariantPrice(pageCount, input.variantPricingMap)
      : Number(input.price ?? 0),
    stripePriceId: String(input.stripePriceId ?? ""),
    imagePath: String(input.imagePath ?? "").trim(),
    downloads: normalizeDownloads(input.downloads ?? []),
  } satisfies ProductVariant;
}

function normalizeVariants(
  variants: ProductVariant[] | undefined,
  fallback: {
    pageCount?: number;
    price?: number;
    stripePriceId?: string;
    imagePath?: string;
    downloads?: ProductDownload[];
  },
  imagePaths: Set<string>,
  variantPricingMap: Map<number, number>,
) {
  const byPageCount = new Map<number, ProductVariant>();

  for (const variant of variants ?? []) {
    const pageCount = Math.max(1, Number(variant.pageCount));

    if (byPageCount.has(pageCount)) {
      throw new Error(
        `Each variant needs a unique page count. "${getVariantLabel(pageCount)}" is duplicated.`,
      );
    }

    byPageCount.set(pageCount, variant);
  }

  return STANDARD_VARIANT_PAGE_COUNTS.map((pageCount) => {
    const variant = byPageCount.get(pageCount);
    const imagePath = variant?.imagePath?.trim() ?? "";
    const downloads =
      variant?.downloads ??
      (Number(fallback.pageCount) === pageCount ? fallback.downloads ?? [] : []);

    return getDefaultVariantValues({
      pageCount,
      stripePriceId: variant?.stripePriceId?.trim() ?? "",
      imagePath: imagePaths.has(imagePath) ? imagePath : "",
      downloads,
      variantPricingMap,
    });
  });
}

function normalizeProduct(input: ProductInput, variantPricingMap: Map<number, number>): Product {
  if (!input.name.trim()) {
    throw new Error("Product name is required.");
  }

  const slug = normalizeProductSlug(input.name);

  if (!slug) {
    throw new Error("Product name must include letters or numbers.");
  }

  const images = normalizeImages(input.images);
  const imagePaths = new Set(images.map((image) => image.path));
  const listingImagePath =
    images.some((image) => image.path === input.listingImagePath)
      ? input.listingImagePath.trim()
      : (images[0]?.path ?? "");
  const variants = normalizeVariants(input.variants, input, imagePaths, variantPricingMap);
  const defaultVariant = variants[0];
  const minPrice = Math.min(...variants.map((variant) => variant.price));

  return {
    ...input,
    name: input.name.trim(),
    slug,
    description: input.description.trim(),
    category: input.category.trim(),
    tagline: input.tagline.trim(),
    gradient: input.gradient.trim() || getDefaultProductGradient(),
    price: minPrice,
    stripePriceId: defaultVariant.stripePriceId,
    pageCount: defaultVariant.pageCount,
    audience: input.audience.map((entry) => entry.trim()).filter(Boolean),
    features: input.features.map((entry) => entry.trim()).filter(Boolean),
    relatedProducts: Array.from(
      new Set(
        (input.relatedProducts ?? [])
          .map((entry) => normalizeProductSlug(entry))
          .filter((entry) => entry && entry !== slug),
      ),
    ),
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

function productFromRecord(
  record: ProductRecord,
  variantPricingMap: Map<number, number>,
): Product {
  const variants = normalizeVariants(record.variants, {
    pageCount: record.page_count,
    price: record.price,
    stripePriceId: record.stripe_price_id,
    downloads: record.downloads ?? [],
  }, new Set((record.images ?? []).map((image) => image.path)), variantPricingMap);
  const defaultVariant = variants[0];
  const minPrice = Math.min(...variants.map((variant) => variant.price));

  return {
    name: record.name,
    slug: record.slug,
    description: record.description,
    price: minPrice,
    stripePriceId: defaultVariant.stripePriceId,
    category: record.category,
    pageCount: defaultVariant.pageCount,
    tagline: record.tagline,
    gradient: record.gradient,
    audience: record.audience ?? [],
    features: record.features ?? [],
    relatedProducts: (record.related_products ?? []).map((entry) => entry.trim()).filter(Boolean),
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
    related_products: product.relatedProducts,
    featured: product.featured,
    listing_image_path: product.listingImagePath,
    images: product.images,
    downloads: defaultVariant.downloads,
    variants: product.variants,
  };
}

function productToLegacyRecord(product: Product) {
  const record = productToRecord(product);

  return {
    name: record.name,
    slug: record.slug,
    description: record.description,
    price: record.price,
    stripe_price_id: record.stripe_price_id,
    category: record.category,
    page_count: record.page_count,
    tagline: record.tagline,
    gradient: record.gradient,
    audience: record.audience,
    features: record.features,
    featured: record.featured,
    listing_image_path: record.listing_image_path,
    images: record.images,
    downloads: record.downloads,
    variants: record.variants,
  };
}

function subscriberFromRecord(record: SubscriberRecord): Subscriber {
  return {
    email: record.email,
    firstName: record.first_name,
    createdAt: record.created_at,
  };
}

function normalizeSiteContent(content: SiteContent): SiteContent {
  const merged = {
    ...defaultSiteContent,
    ...content,
    homepage: {
      ...defaultSiteContent.homepage,
      ...(content?.homepage ?? {}),
      shop: {
        ...defaultSiteContent.homepage.shop,
        ...(content?.homepage?.shop ?? {}),
      },
      howItWorks: {
        ...defaultSiteContent.homepage.howItWorks,
        ...(content?.homepage?.howItWorks ?? {}),
      },
      newsletter: {
        ...defaultSiteContent.homepage.newsletter,
        ...(content?.homepage?.newsletter ?? {}),
      },
    },
    productPage: {
      ...defaultSiteContent.productPage,
      ...(content?.productPage ?? {}),
    },
    contactPage: {
      ...defaultSiteContent.contactPage,
      ...(content?.contactPage ?? {}),
    },
    heroHighlight: {
      ...defaultSiteContent.heroHighlight,
      ...(content?.heroHighlight ?? {}),
    },
    valueProps: (content?.valueProps ?? defaultSiteContent.valueProps).map((value, index) => ({
      ...defaultSiteContent.valueProps[index % defaultSiteContent.valueProps.length],
      ...value,
    })),
    steps: (content?.steps ?? defaultSiteContent.steps).map((step, index) => ({
      ...defaultSiteContent.steps[index % defaultSiteContent.steps.length],
      ...step,
    })),
    faqs: (content?.faqs ?? defaultSiteContent.faqs).map((faq, index) => ({
      ...defaultSiteContent.faqs[index % defaultSiteContent.faqs.length],
      ...faq,
    })),
  } satisfies SiteContent;

  return {
    ...merged,
    variantPricing: normalizeVariantPricing(content?.variantPricing),
  };
}

export async function getProducts() {
  const variantPricingMap = createVariantPricingMap((await getSiteContent()).variantPricing);

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

      return (data as ProductRecord[]).map((record) => productFromRecord(record, variantPricingMap));
    } catch {
      const products = await readJsonFile<ProductInput[]>(productsPath);
      return products.map((product) => normalizeProduct(product, variantPricingMap));
    }
  }

  const products = await readJsonFile<ProductInput[]>(productsPath);
  return products
    .map((product) => normalizeProduct(product, variantPricingMap))
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
  const variantPricingMap = createVariantPricingMap((await getSiteContent()).variantPricing);
  const product = normalizeProduct(input, variantPricingMap);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    let { data, error } = await supabase
      .from("products")
      .insert(productToRecord(product))
      .select()
      .single();

    if (error && isMissingRelatedProductsColumnError(error.message)) {
      ({ data, error } = await supabase
        .from("products")
        .insert(productToLegacyRecord(product))
        .select()
        .single());
    }

    if (error) {
      throw new Error(mapSupabaseProductError("save", error.message));
    }

    return productFromRecord(data as ProductRecord, variantPricingMap);
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
  const variantPricingMap = createVariantPricingMap((await getSiteContent()).variantPricing);
  const product = normalizeProduct(input, variantPricingMap);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    let { data, error } = await supabase
      .from("products")
      .update(productToRecord(product))
      .eq("slug", slug)
      .select()
      .single();

    if (error && isMissingRelatedProductsColumnError(error.message)) {
      ({ data, error } = await supabase
        .from("products")
        .update(productToLegacyRecord(product))
        .eq("slug", slug)
        .select()
        .single());
    }

    if (error) {
      throw new Error(mapSupabaseProductError("update", error.message));
    }

    return productFromRecord(data as ProductRecord, variantPricingMap);
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
    variants: product.variants.map((variant) => ({
      ...variant,
      imagePath: images.some((image) => image.path === variant.imagePath) ? variant.imagePath : "",
    })),
  });
}

export async function updateProductVariantImagePath(
  slug: string,
  variantId: string,
  imagePath: string,
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
            imagePath,
          }
        : variant,
    ),
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

      return normalizeSiteContent((data as SiteContentRecord).value);
    } catch {
      return normalizeSiteContent(await readJsonFile<SiteContent>(siteContentPath));
    }
  }

  return normalizeSiteContent(await readJsonFile<SiteContent>(siteContentPath));
}

export async function updateSiteContent(input: SiteContent) {
  const siteContent = normalizeSiteContent(input);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("site_content")
      .upsert({ key: siteContentKey, value: siteContent }, { onConflict: "key" })
      .select()
      .single();

    if (error) {
      throw new Error(`Unable to save site content: ${error.message}`);
    }

    return normalizeSiteContent((data as SiteContentRecord).value);
  }

  await writeJsonFile(siteContentPath, siteContent);
  return siteContent;
}
