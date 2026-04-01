import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductDescription } from "@/components/product-description";
import { ProductCard } from "@/components/product-card";
import { getProductImageUrl } from "@/lib/product-assets";
import { getProductBySlug, getProducts, getSiteContent } from "@/lib/store";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export async function generateStaticParams() {
  const products = await getProducts();

  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, products, siteContent] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getSiteContent(),
  ]);

  if (!product) {
    notFound();
  }

  const galleryImages = product.images.map((image) => ({
    path: image.path,
    src: getProductImageUrl(image.path),
    alt: image.alt || product.name,
  }));
  const paidVariantPrices = product.variants
    .map((variant) => variant.price)
    .filter((price) => price > 0);
  const minPrice =
    paidVariantPrices.length > 0
      ? Math.min(...paidVariantPrices)
      : Math.min(...product.variants.map((variant) => variant.price));
  const maxPageCount = Math.max(...product.variants.map((variant) => variant.pageCount));
  const selectedRelatedProducts = product.relatedProducts
    .map((relatedSlug) => products.find((entry) => entry.slug === relatedSlug))
    .filter((entry): entry is Product => Boolean(entry))
    .slice(0, 3);
  const fallbackProducts = [...products]
    .filter((entry) => entry.slug !== product.slug)
    .sort(
      (left, right) =>
        hashString(`${product.slug}:${left.slug}`) - hashString(`${product.slug}:${right.slug}`),
    )
    .slice(0, 3);
  const relatedProducts =
    selectedRelatedProducts.length > 0 ? selectedRelatedProducts : fallbackProducts;

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <ProductDetailClient
        galleryImages={galleryImages}
        maxPageCount={maxPageCount}
        minPrice={minPrice}
        product={product}
      />

      <section className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <div className="max-w-4xl">
          <p className="pill-label w-fit text-[var(--brand-berry)]">
            {siteContent.productPage.aboutPrintableEyebrow}
          </p>
          <div className="mt-5 rounded-[1.5rem] bg-white/70 px-5 py-5 sm:px-6">
            <ProductDescription description={product.description} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-ink)]">
            {siteContent.productPage.perfectForEyebrow}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {product.audience.map((group) => (
              <span
                key={group}
                className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700"
              >
                {group}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <div className="gradient-soft rounded-[1.5rem] px-4 py-4">
              <h2 className="text-base font-black text-[var(--brand-ink)]">
                {siteContent.productPage.afterPurchaseTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {siteContent.productPage.afterPurchaseDescription}
              </p>
            </div>
            <Link className="secondary-button" href="/#shop">
              {siteContent.productPage.browseMoreLabel}
            </Link>
          </div>
        </div>
        <div className="gradient-cool-panel rounded-[2rem] px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7">
          <NewsletterForm
            heading={siteContent.productPage.newsletterHeading}
            subheading={siteContent.productPage.newsletterSubheading}
          />
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="pill-label w-fit text-[var(--brand-coral)]">Related printables</p>
              <h2 className="section-title mt-3 text-2xl text-[var(--brand-ink)] sm:text-3xl">
                You may also like
              </h2>
            </div>
            <Link className="secondary-button" href="/#shop">
              Browse all printables
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.slug} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
