import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminProductManager } from "@/components/admin-product-manager";
import { requireAdminUser } from "@/lib/auth";
import { getProducts, getSiteContent, getSubscribers } from "@/lib/store";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const user = await requireAdminUser();
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
          Supabase auth now protects this dashboard. When your Supabase service
          role key is configured, product and subscriber data will be read from
          your hosted database instead of local JSON files.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-600">
            Signed in as <span className="text-[var(--brand-ink)]">{user.email}</span>
          </p>
          <AdminLogoutButton />
        </div>
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

      <AdminProductManager
        initialProducts={products}
        initialVariantPricing={siteContent.variantPricing}
      />
    </div>
  );
}
