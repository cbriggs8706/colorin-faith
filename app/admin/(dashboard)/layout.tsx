import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser();

  return (
    <div className="py-6 sm:py-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="card-surface rounded-[2rem] px-5 py-6">
            <p className="pill-label w-fit text-[var(--brand-ink)]">Admin workspace</p>
            <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
              Keep the shop organized.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Split product editing, homepage copy, contact messaging, and product-page messaging
              into focused screens.
            </p>
            <p className="mt-5 text-sm font-bold text-slate-600">
              Signed in as <span className="text-[var(--brand-ink)]">{user.email}</span>
            </p>
            <div className="mt-4">
              <AdminLogoutButton />
            </div>
          </section>

          <AdminSidebarNav />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
