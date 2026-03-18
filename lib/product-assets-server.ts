import { PRODUCT_DOWNLOAD_BUCKET } from "@/lib/product-assets";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { ProductDownload } from "@/lib/types";

export async function createSignedDownloadLinks(downloads: ProductDownload[]) {
  if (!hasSupabaseDatabaseEnv() || downloads.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const signed = await Promise.all(
    downloads.map(async (download) => {
      const { data, error } = await supabase.storage
        .from(PRODUCT_DOWNLOAD_BUCKET)
        .createSignedUrl(download.path, 60 * 60, {
          download: true,
        });

      if (error || !data?.signedUrl) {
        return null;
      }

      return {
        ...download,
        signedUrl: data.signedUrl,
      };
    }),
  );

  return signed.filter(Boolean) as Array<ProductDownload & { signedUrl: string }>;
}
