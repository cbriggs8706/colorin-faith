import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/buy-button";
import { NewsletterForm } from "@/components/newsletter-form";
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

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div
          className="relative min-h-[380px] overflow-hidden rounded-[2rem] p-6 sm:p-8"
          style={{ background: product.gradient }}
        >
          <div className="absolute left-5 top-5 rounded-full bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            {product.category}
          </div>
          <div className="absolute right-6 top-8 text-6xl sm:text-7xl">{product.emoji}</div>
          <div className="absolute bottom-6 left-6 right-6 rounded-[1.7rem] bg-white/78 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
              {product.tagline}
            </p>
            <h1 className="section-title mt-2 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
              {product.description}
            </p>
          </div>
        </div>

        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
                Instant download
              </p>
              <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <span className="rounded-full bg-white/75 px-3 py-2 text-sm font-bold text-slate-700">
              {product.pageCount} pages
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
                Stripe sends the customer through checkout now, and this starter
                includes success and cancel pages. Connect your delivery workflow
                next by pairing checkout completion with secure file delivery.
              </p>
            </div>
            <Link className="secondary-button" href="/shop">
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
