import { getSupabaseUrl } from "@/lib/supabase/env";
import type { ProductImage } from "@/lib/types";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_DOWNLOAD_BUCKET = "product-downloads";

export const PRODUCT_GRADIENTS = [
  "linear-gradient(135deg, #ffb400, #ff7a00 18%, #ef4058 46%, #1f98ee 74%, #2743b6)",
  "linear-gradient(135deg, #1f98ee, #1150b5 34%, #2743b6 54%, #ffb400 82%, #ff7a00)",
  "linear-gradient(135deg, #e533b6, #4f1b84 26%, #2743b6 54%, #1f98ee 74%, #ef4058)",
  "linear-gradient(135deg, #f97316, #fb7185 28%, #c026d3 58%, #2563eb 100%)",
  "linear-gradient(135deg, #14b8a6, #22c55e 26%, #facc15 62%, #f97316 100%)",
  "linear-gradient(135deg, #fb7185, #f97316 24%, #facc15 52%, #38bdf8 82%, #6366f1)",
];

export function getDefaultProductGradient() {
  return PRODUCT_GRADIENTS[0];
}

export function createStoragePath(slug: string, fileName: string) {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${slug}/${Date.now()}-${safeFileName}`;
}

export function getProductImageUrl(path: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "";
  }

  const baseUrl = getSupabaseUrl();
  return `${baseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

export function withImageUrls(images: ProductImage[]) {
  return images.map((image) => ({
    ...image,
    url: getProductImageUrl(image.path),
  }));
}
