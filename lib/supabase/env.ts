export function hasSupabaseAuthEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function hasSupabaseDatabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  return value;
}

export function getSupabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.",
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return value;
}

export function getSiteUrl() {
  const value = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a public https origin in production.");
    }
  }

  return value;
}

export function getResendApiKey() {
  const value = process.env.RESEND_API_KEY;

  if (!value) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  return value;
}

export function getStripeWebhookSecret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET;

  if (!value) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }

  return value;
}

export function getContactFromEmail() {
  return (
    process.env.CONTACT_FROM_EMAIL ??
    "Color in Faith <noreply@colorinfaithprintables.com>"
  );
}

export function getReceiptFromEmail() {
  return process.env.RECEIPT_FROM_EMAIL ?? getContactFromEmail();
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return getAdminEmails().includes(email.trim().toLowerCase());
}
