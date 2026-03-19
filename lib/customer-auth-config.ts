export function getCustomerAuthSchema() {
  return process.env.NEXTAUTH_SUPABASE_SCHEMA ?? "public";
}

export function hasGoogleAuthProvider() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
