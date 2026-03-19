import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignupForm } from "@/components/auth/signup-form";
import { hasGoogleAuthProvider } from "@/lib/customer-auth-config";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, email } = await searchParams;
  const safeCallbackUrl = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/orders";

  if (session) {
    redirect(safeCallbackUrl);
  }

  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label w-fit text-[var(--brand-mint)]">Create account</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Save your orders in one place.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Create an account with the same email you used at checkout, and we&apos;ll show your
          previous purchases with fresh download links.
        </p>

        {hasGoogleAuthProvider() ? (
          <div className="mt-6 space-y-4">
            <GoogleSignInButton callbackUrl={safeCallbackUrl} label="Continue with Google" />
            <div className="text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              or create a password
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <SignupForm email={email} callbackUrl={safeCallbackUrl} />
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
            className="font-bold text-[var(--brand-ink)] underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
