import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts, getSiteContent } from "@/lib/store";

export default async function Home() {
  const [featuredProducts, siteContent] = await Promise.all([
    getFeaturedProducts(),
    getSiteContent(),
  ]);

  return (
    <div className="flex flex-col gap-12 py-6 sm:gap-16 sm:py-8">
      <section className="relative overflow-hidden rounded-[2rem] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="card-surface absolute inset-0 rounded-[2rem]" />
        <div className="pointer-events-none absolute -left-12 top-8 h-28 w-28 rounded-full bg-[var(--brand-sunrise)]/50 blur-2xl" />
        <div className="pointer-events-none absolute left-1/3 top-3 h-24 w-24 rounded-full bg-[var(--brand-fuchsia)]/24 blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-[var(--brand-sky)]/45 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-8 h-28 w-28 rounded-full bg-[var(--brand-violet)]/24 blur-2xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="pill-label w-fit text-[var(--brand-ink)]">
              Colorful faith-based printables
            </span>
            <div className="space-y-4">
              <h1 className="section-title max-w-xl text-4xl leading-none font-extrabold text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
                Bright coloring pages that turn quiet moments into faith-filled fun.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Help kids connect with Bible stories, Scripture memory, and joyful
                creativity through instant-download printable sets made for home,
                church, and classroom use.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="primary-button" href="/shop">
                Shop Printables
              </Link>
              <Link className="secondary-button" href="/about">
                Meet the Brand
              </Link>
            </div>
            <div className="grid gap-3 pt-2 text-sm font-semibold text-slate-700 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-white/70 px-4 py-3">
                Instant digital downloads
              </div>
              <div className="rounded-[1.4rem] bg-white/70 px-4 py-3">
                Family-friendly bright artwork
              </div>
              <div className="rounded-[1.4rem] bg-white/70 px-4 py-3">
                Great for homeschool and ministry
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[2rem] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(32,48,66,0.16)]">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-berry)]">
                Best Seller
              </p>
              <h2 className="section-title mt-2 text-2xl font-extrabold">
                {siteContent.heroHighlight.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {siteContent.heroHighlight.description}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-[var(--surface-pop)] px-4 py-3">
                <span className="text-sm font-bold text-slate-700">
                  {siteContent.heroHighlight.pages} printable pages
                </span>
                <span className="text-lg font-black text-[var(--brand-ink)]">
                  {siteContent.heroHighlight.price}
                </span>
              </div>
            </div>
            <div className="gradient-soft rounded-[2rem] border border-white/80 px-5 py-5 shadow-[0_18px_45px_rgba(32,48,66,0.14)]">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-coral)]">
                Built for easy sales
              </p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                <li>Stripe checkout ready for one-time digital purchases</li>
                <li>File-backed admin dashboard for products and content</li>
                <li>Email capture section ready for launch freebies and promos</li>
              </ul>
            </div>
          </div>
        </div>
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

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="pill-label w-fit text-[var(--brand-berry)]">Featured shop picks</p>
            <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
              Start with the printable packs families love most.
            </h2>
          </div>
          <Link className="hidden font-extrabold text-[var(--brand-ink)] sm:inline-flex" href="/shop">
            View all products
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
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
              subheading="Subscribers are saved in a lightweight local store for now, so you can connect your email platform next."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
