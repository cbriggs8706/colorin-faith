import { AdminProductManager } from "@/components/admin-product-manager";
import { getProducts, getSiteContent, getSubscribers } from "@/lib/store";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [products, siteContent, subscribers] = await Promise.all([
    getProducts(),
    getSiteContent(),
    getSubscribers(),
  ]);

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-ink)]">Lightweight admin</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Manage products and launch-readiness from one simple dashboard.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          This starter uses local JSON files as a lightweight CMS so you can edit
          products without adding a database on day one. For production hosting on
          platforms like Vercel, move these records into a database or external CMS.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
            Products
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
            {products.length}
          </p>
        </div>
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
            Subscribers
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
            {subscribers.length}
          </p>
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

      <AdminProductManager initialProducts={products} />
    </div>
  );
}
