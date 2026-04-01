import { CUSTOM_ORDER_BUCKET } from "@/lib/custom-order-assets";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function createSignedUrl(path: string) {
  if (!hasSupabaseDatabaseEnv() || !path) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(CUSTOM_ORDER_BUCKET)
    .createSignedUrl(path, 60 * 60, {
      download: true,
    });

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
