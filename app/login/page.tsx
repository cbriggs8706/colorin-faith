import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { hasGoogleAuthProvider } from "@/lib/customer-auth-config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/orders";

  if (session) {
    redirect(safeCallbackUrl);
  }

  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Customer account</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Sign in to see your orders.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Use the same email address you checked out with so we can match your previous purchases
          and fresh download links.
        </p>

        <div className="mt-6">
          <LoginForm callbackUrl={safeCallbackUrl} allowGoogle={hasGoogleAuthProvider()} />
        </div>
      </section>
    </div>
  );
}
