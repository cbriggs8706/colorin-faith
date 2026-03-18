import { promises as fs } from "node:fs";
import path from "node:path";
import type { Product, ProductInput, SiteContent, Subscriber } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const productsPath = path.join(dataDirectory, "products.json");
const subscribersPath = path.join(dataDirectory, "subscribers.json");
const siteContentPath = path.join(dataDirectory, "site-content.json");

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

function normalizeProduct(input: ProductInput): Product {
  if (!input.name.trim()) {
    throw new Error("Product name is required.");
  }

  if (!input.slug.trim()) {
    throw new Error("Product slug is required.");
  }

  return {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim(),
    stripePriceId: input.stripePriceId.trim(),
    category: input.category.trim(),
    tagline: input.tagline.trim(),
    emoji: input.emoji.trim() || "🎨",
    gradient: input.gradient.trim(),
    price: Number(input.price),
    pageCount: Number(input.pageCount),
    audience: input.audience.map((entry) => entry.trim()).filter(Boolean),
    features: input.features.map((entry) => entry.trim()).filter(Boolean),
    featured: Boolean(input.featured),
  };
}

export async function getProducts() {
  const products = await readJsonFile<Product[]>(productsPath);
  return products.sort((left, right) => left.name.localeCompare(right.name));
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
  const products = await getProducts();
  const nextProducts = products.filter((product) => product.slug !== slug);

  if (nextProducts.length === products.length) {
    throw new Error("Product not found.");
  }

  await writeJsonFile(productsPath, nextProducts);
}

export async function getSubscribers() {
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
  return readJsonFile<SiteContent>(siteContentPath);
}
