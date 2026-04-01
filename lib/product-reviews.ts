import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type {
  CustomOrderRecord,
  ProductReviewRecord,
  ProductReviewType,
  ProductReviewWithUrls,
} from "@/lib/types";
import type { OrderRecord } from "@/lib/orders";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function mapProductReviewRecord(record: Partial<ProductReviewRecord>) {
  return {
    id: record.id ?? "",
    customer_email: record.customer_email ?? "",
    customer_name: record.customer_name ?? null,
    review_type: record.review_type ?? "standard",
    order_id: record.order_id ?? "",
    product_slug: record.product_slug ?? "",
    product_name: record.product_name ?? "",
    variant_id: record.variant_id ?? null,
    rating: normalizeRating(record.rating ?? 5),
    title: record.title ?? "",
    review: record.review ?? "",
    photo_paths: record.photo_paths ?? [],
    status: record.status ?? "pending",
    created_at: record.created_at ?? new Date(0).toISOString(),
    updated_at: record.updated_at ?? new Date(0).toISOString(),
  } satisfies ProductReviewRecord;
}

export function createStandardOrderReviewId(order: Pick<OrderRecord, "stripe_session_id" | "product_slug" | "variant_id">) {
  return `${order.stripe_session_id}:${order.product_slug}:${order.variant_id}`;
}

export function createCustomOrderReviewId(order: Pick<CustomOrderRecord, "id">) {
  return order.id;
}

async function createSignedPhotoUrls(paths: string[]) {
  const supabase = createSupabaseServiceRoleClient();
  const signedEntries = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("customer-review-photos")
        .createSignedUrl(path, 60 * 60, {
          download: false,
        });

      if (error || !data?.signedUrl) {
        return null;
      }

      return {
        path,
        signedUrl: data.signedUrl,
      };
    }),
  );

  return signedEntries.filter(Boolean) as ProductReviewWithUrls["photoUrls"];
}

export async function getProductReviewsForCustomer(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("customer_email", normalizeEmail(email))
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load reviews: ${error.message}`);
  }

  return Promise.all(
    ((data ?? []) as Partial<ProductReviewRecord>[]).map(async (entry) => {
      const review = mapProductReviewRecord(entry);

      return {
        review,
        photoUrls: await createSignedPhotoUrls(review.photo_paths),
      } satisfies ProductReviewWithUrls;
    }),
  );
}

export async function getProductReviewForOrder(
  reviewType: ProductReviewType,
  orderId: string,
  email: string,
) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("review_type", reviewType)
    .eq("order_id", orderId)
    .eq("customer_email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load review: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const review = mapProductReviewRecord(data as Partial<ProductReviewRecord>);

  return {
    review,
    photoUrls: await createSignedPhotoUrls(review.photo_paths),
  } satisfies ProductReviewWithUrls;
}

type UpsertProductReviewInput = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  reviewType: ProductReviewType;
  orderId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  rating: number;
  title: string;
  review: string;
  photoPaths: string[];
  status?: ProductReviewRecord["status"];
};

export async function upsertProductReview(input: UpsertProductReviewInput) {
  const timestamp = new Date().toISOString();
  const supabase = createSupabaseServiceRoleClient();
  const payload = {
    id: input.id,
    customer_email: normalizeEmail(input.customerEmail),
    customer_name: input.customerName,
    review_type: input.reviewType,
    order_id: input.orderId,
    product_slug: input.productSlug,
    product_name: input.productName,
    variant_id: input.variantId,
    rating: normalizeRating(input.rating),
    title: input.title.trim(),
    review: input.review.trim(),
    photo_paths: input.photoPaths,
    status: input.status ?? "pending",
    updated_at: timestamp,
  };

  const { data, error } = await supabase
    .from("product_reviews")
    .upsert(payload, { onConflict: "review_type,order_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save review: ${error.message}`);
  }

  const review = mapProductReviewRecord(data as Partial<ProductReviewRecord>);

  return {
    review,
    photoUrls: await createSignedPhotoUrls(review.photo_paths),
  } satisfies ProductReviewWithUrls;
}
