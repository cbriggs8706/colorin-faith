import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminUser } from "@/lib/auth";
import { getAdminEmails, hasSupabaseAuthEnv } from "@/lib/supabase/env";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const user = await getAdminUser();

  if (user) {
    redirect("/admin");
  }

  const isConfigured = hasSupabaseAuthEnv();
  const adminEmails = getAdminEmails();

  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card-surface rounded-[2rem] px-6 py-7">
          <p className="pill-label w-fit text-[var(--brand-coral)]">Supabase auth</p>
          <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
            Admin login for your storefront.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Sign in with your Supabase email and password to manage products,
            subscribers, and launch content.
          </p>
          <div className="mt-6 rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm leading-6 text-slate-700">
            <p className="font-black text-[var(--brand-ink)]">Allowed admin emails</p>
            <p className="mt-2">
              {adminEmails.length > 0 ? adminEmails.join(", ") : "Set ADMIN_EMAILS in your env file."}
            </p>
          </div>
        </div>

        <div className="gradient-cool-panel rounded-[2rem] px-6 py-7 shadow-[0_24px_60px_rgba(32,48,66,0.12)]">
          {isConfigured ? (
            <AdminLoginForm />
          ) : (
            <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-slate-700">
              <p className="font-black text-[var(--brand-ink)]">
                Supabase auth is not configured yet.
              </p>
              <p className="mt-2">
                Add `NEXT_PUBLIC_SUPABASE_URL`,
                `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `ADMIN_EMAILS` to
                your local env file before using admin login.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
