import Link from "next/link";
import { getProducts, getSiteContent, getSubscribers } from "@/lib/store";

export const metadata = {
  title: "Admin",
};

const quickLinks = [
  {
    href: "/admin/products",
    eyebrow: "Catalog",
    title: "Products and pricing",
    description: "Browse the full product list, create new products, and edit shared variant prices.",
  },
  {
    href: "/admin/content/homepage",
    eyebrow: "Homepage copy",
    title: "Homepage wording",
    description: "Adjust the storefront intro, value cards, How It Works section, and newsletter panel.",
  },
  {
    href: "/admin/content/product-page",
    eyebrow: "Product copy",
    title: "Product page wording",
    description: "Update the reusable product-page headings, after-purchase copy, and newsletter text.",
  },
  {
    href: "/admin/content/faqs",
    eyebrow: "Support copy",
    title: "FAQs",
    description: "Keep questions and answers separate so routine copy updates are easier to manage.",
  },
  {
    href: "/admin/custom-order",
    eyebrow: "Custom offer",
    title: "Custom product and fulfillment",
    description: "Edit the separate featured custom product, manage Stripe page prices, and fulfill uploaded orders.",
  },
];

export default async function AdminOverviewPage() {
  const [products, siteContent, subscribers] = await Promise.all([
    getProducts(),
    getSiteContent(),
    getSubscribers(),
  ]);

  return (
    <div className="space-y-6">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-sky)]">
          Overview
        </p>
        <h2 className="mt-3 text-4xl font-black text-[var(--brand-ink)] sm:text-5xl">
          Choose a focused admin route instead of one crowded page.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Product editing, homepage messaging, product-page wording, and FAQs now each have their
          own destination so you can move around the admin faster.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
            Products
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">{products.length}</p>
        </div>
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
            Subscribers
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">{subscribers.length}</p>
        </div>
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-mint)]">
            FAQ entries
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
            {siteContent.faqs.length}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            className="card-surface rounded-[1.75rem] px-5 py-5 transition-transform duration-150 hover:-translate-y-0.5"
            href={link.href}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              {link.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-black text-[var(--brand-ink)]">{link.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{link.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
