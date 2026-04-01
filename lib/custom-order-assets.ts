import { getSupabaseUrl } from "@/lib/supabase/env";

export const CUSTOM_ORDER_BUCKET = "custom-order";
export const CUSTOM_ORDER_MAX_FILE_SIZE = 25 * 1024 * 1024;

const EXPLICIT_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const EXPLICIT_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".heic",
  ".heif",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function createCustomOrderStoragePath(
  orderId: string,
  type: "source" | "deliverable",
  fileName: string,
) {
  return `${orderId}/${type}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function isAllowedCustomOrderFile(file: File) {
  const fileName = file.name.trim().toLowerCase();
  const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";

  return (
    file.type.startsWith("image/") ||
    EXPLICIT_UPLOAD_MIME_TYPES.has(file.type) ||
    EXPLICIT_UPLOAD_EXTENSIONS.has(extension)
  );
}

export function getCustomOrderFileAccept() {
  return ".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,image/*,application/pdf";
}

export function getCustomOrderPublicImageUrl(path: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "";
  }

  return `${getSupabaseUrl()}/storage/v1/object/public/product-images/${path}`;
}
