import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/buy-button";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductDescription } from "@/components/product-description";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { getProductImageUrl } from "@/lib/product-assets";
import { getProductBySlug, getProducts } from "@/lib/store";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const galleryImages = product.images.map((image) => ({
    src: getProductImageUrl(image.path),
    alt: image.alt || product.name,
  }));
  const minPrice = Math.min(...product.variants.map((variant) => variant.price));
  const maxPageCount = Math.max(...product.variants.map((variant) => variant.pageCount));

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="card-surface overflow-hidden rounded-[2rem] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-2 pt-2">
            <div>
              <div className="rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                {product.category}
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
                {product.tagline}
              </p>
              <h1 className="section-title mt-2 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
                {product.name}
              </h1>
            </div>
          </div>
          {galleryImages.length > 0 ? (
            <ProductImageGallery images={galleryImages} />
          ) : (
            <div
              className="min-h-[380px] rounded-[2rem]"
              style={{ background: product.gradient }}
            />
          )}
        </div>

        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
                Instant download
              </p>
              <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
                From ${minPrice.toFixed(2)}
              </p>
            </div>
            <span className="rounded-full bg-white/75 px-3 py-2 text-sm font-bold text-slate-700">
              Up to {maxPageCount} pages
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Includes a printable PDF download for personal, classroom, or ministry
            use according to your shop policies.
          </p>
          <div className="mt-6">
            <BuyButton product={product} />
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-white/75 px-4 py-4">
            <h2 className="text-base font-black text-[var(--brand-ink)]">
              What&apos;s included
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {product.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <div className="max-w-4xl">
          <p className="pill-label w-fit text-[var(--brand-berry)]">About this printable</p>
          <div className="mt-5 rounded-[1.5rem] bg-white/70 px-5 py-5 sm:px-6">
            <ProductDescription description={product.description} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-ink)]">Perfect for</p>
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
                After purchase
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Customers are sent through secure Stripe checkout, then returned
                to a download page with access to the files attached to this product.
              </p>
            </div>
            <Link className="secondary-button" href="/#shop">
              Browse more printables
            </Link>
          </div>
        </div>
        <div className="gradient-cool-panel rounded-[2rem] px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7">
          <NewsletterForm
            heading="Want launch specials and new printable drops?"
            subheading="Invite visitors to stay in the loop while you grow your store."
          />
        </div>
      </section>
    </div>
  );
}
