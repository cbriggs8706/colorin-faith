export const PRODUCT_REVIEW_BUCKET = "customer-review-photos";
export const PRODUCT_REVIEW_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const PRODUCT_REVIEW_MAX_PHOTO_COUNT = 5;

const ALLOWED_REVIEW_IMAGE_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const ALLOWED_REVIEW_IMAGE_EXTENSIONS = new Set([
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

export function createProductReviewPhotoPath(reviewId: string, fileName: string) {
  return `${reviewId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function isAllowedProductReviewImage(file: File) {
  const fileName = file.name.trim().toLowerCase();
  const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";

  return file.type.startsWith("image/") ||
    ALLOWED_REVIEW_IMAGE_MIME_TYPES.has(file.type) ||
    ALLOWED_REVIEW_IMAGE_EXTENSIONS.has(extension);
}

export function getProductReviewImageAccept() {
  return ".png,.jpg,.jpeg,.webp,.heic,.heif,image/*";
}
