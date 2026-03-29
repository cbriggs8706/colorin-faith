import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import { getProducts, getSiteContent } from "@/lib/store";

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [products, siteContent, resolvedSearchParams] = await Promise.all([
    getProducts(),
    getSiteContent(),
    searchParams,
  ]);
  const selectedCategory = getSingleSearchParam(resolvedSearchParams.category);
  const categories = [
    ...new Set(
      products
        .map((product) => product.category.trim())
        .filter(Boolean),
    ),
  ];
  const visibleProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;
  const featuredProduct =
    visibleProducts.find((product) => product.featured) ?? visibleProducts[0] ?? null;
  const remainingProducts = featuredProduct
    ? visibleProducts.filter((product) => product.slug !== featuredProduct.slug)
    : [];

  return (
    <div className="flex flex-col gap-10 py-4 sm:gap-14 sm:py-6">
      <section id="shop" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="pill-label w-fit text-[var(--brand-berry)]">Digital shop</p>
            <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
              Printable coloring pages for joyful, screen-free moments.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              Every product here is an instant digital download. Use these pages for
              family devotion time, Sunday school, Christian classrooms, party tables,
              and everyday creative encouragement.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className={
              selectedCategory
                ? "secondary-button px-4 py-2 text-sm"
                : "primary-button px-4 py-2 text-sm"
            }
            href="/#shop"
          >
            All products
          </Link>
          {categories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <Link
                key={category}
                className={
                  isActive
                    ? "primary-button px-4 py-2 text-sm"
                    : "secondary-button px-4 py-2 text-sm"
                }
                href={`/?category=${encodeURIComponent(category)}#shop`}
              >
                {category}
              </Link>
            );
          })}
        </div>
        {featuredProduct ? (
          <div className="space-y-5">
            <ProductCard product={featuredProduct} variant="featured" />
            {remainingProducts.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {remainingProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
            <p className="text-base font-bold text-slate-700">
              No products match that category yet.
            </p>
          </section>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {siteContent.valueProps.map((value) => (
          <div
            key={value.title}
            className="card-surface rounded-[1.75rem] px-5 py-5"
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{ backgroundColor: value.accent }}
            >
              {value.icon}
            </div>
            <h2 className="text-lg font-black text-[var(--brand-ink)]">
              {value.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {value.description}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-coral)]">How it works</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)]">
            From browse to print in just a few taps.
          </h2>
          <div className="mt-6 space-y-4">
            {siteContent.steps.map((step, index) => (
              <div key={step.title} className="rounded-[1.5rem] bg-white/75 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-sky)] font-black text-[var(--brand-ink)]">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-black text-[var(--brand-ink)]">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="gradient-soft rounded-[2rem] px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-ink)]">Freebie list</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)]">
            Grow your email list with a cheerful welcome freebie.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">
            Invite parents, grandparents, and ministry leaders to get early access,
            coupon drops, and new seasonal printable releases.
          </p>
          <div className="mt-6">
            <NewsletterForm
              heading="Get launch emails and a printable freebie."
              subheading="Join the list for new printable releases, special offers, and cheerful faith-filled freebies."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
