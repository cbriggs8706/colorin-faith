import { NextResponse } from "next/server";
import { requireCustomerUser } from "@/lib/customer-auth";
import {
  PRODUCT_REVIEW_BUCKET,
  PRODUCT_REVIEW_MAX_FILE_SIZE,
  PRODUCT_REVIEW_MAX_PHOTO_COUNT,
  createProductReviewPhotoPath,
  isAllowedProductReviewImage,
} from "@/lib/product-review-assets";
import {
  createCustomOrderReviewId,
  createStandardOrderReviewId,
  getProductReviewForOrder,
  upsertProductReview,
} from "@/lib/product-reviews";
import { getCustomOrderById } from "@/lib/custom-orders";
import { getOrdersForCustomerEmail } from "@/lib/orders";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { ProductReviewType } from "@/lib/types";

function normalizeReviewType(value: FormDataEntryValue | null): ProductReviewType | null {
  return value === "standard" || value === "custom" ? value : null;
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeRating(value: FormDataEntryValue | null) {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return rating;
}

async function resolveOrder(
  reviewType: ProductReviewType,
  orderId: string,
  customerEmail: string,
) {
  if (reviewType === "standard") {
    const orders = await getOrdersForCustomerEmail(customerEmail);
    const order = orders.find((entry) => createStandardOrderReviewId(entry) === orderId);

    if (!order) {
      return null;
    }

    return {
      orderId,
      productSlug: order.product_slug,
      productName: order.product_name,
      variantId: order.variant_id,
    };
  }

  const order = await getCustomOrderById(orderId);

  if (!order || order.customer_email?.trim().toLowerCase() !== customerEmail.trim().toLowerCase()) {
    return null;
  }

  return {
    orderId: createCustomOrderReviewId(order),
    productSlug: order.product_slug,
    productName: order.product_name,
    variantId: null,
  };
}

export async function POST(request: Request) {
  const { user } = await requireCustomerUser({ callbackUrl: "/orders" });

  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Reviews are unavailable until Supabase storage is configured." },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const reviewType = normalizeReviewType(formData.get("reviewType"));
    const orderId = normalizeText(formData.get("orderId"));
    const title = normalizeText(formData.get("title"));
    const reviewText = normalizeText(formData.get("review"));
    const rating = normalizeRating(formData.get("rating"));

    if (!reviewType) {
      return NextResponse.json({ error: "Choose a valid review type." }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "Order details are missing." }, { status: 400 });
    }

    if (!rating) {
      return NextResponse.json({ error: "Choose a rating between 1 and 5." }, { status: 400 });
    }

    if (!reviewText) {
      return NextResponse.json({ error: "Write a short review before submitting." }, { status: 400 });
    }

    if (reviewText.length > 1500) {
      return NextResponse.json(
        { error: "Reviews must be 1,500 characters or fewer." },
        { status: 400 },
      );
    }

    const order = await resolveOrder(reviewType, orderId, user.email);

    if (!order) {
      return NextResponse.json(
        { error: "We could not verify that purchase for your account." },
        { status: 404 },
      );
    }

    const files = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > PRODUCT_REVIEW_MAX_PHOTO_COUNT) {
      return NextResponse.json(
        { error: `Upload up to ${PRODUCT_REVIEW_MAX_PHOTO_COUNT} photos.` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.size > PRODUCT_REVIEW_MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Each photo must be 10 MB or smaller." },
          { status: 400 },
        );
      }

      if (!isAllowedProductReviewImage(file)) {
        return NextResponse.json(
          { error: "Upload PNG, JPG, WEBP, HEIC, or HEIF images." },
          { status: 400 },
        );
      }
    }

    const existingReview = await getProductReviewForOrder(reviewType, order.orderId, user.email);
    const reviewId = existingReview?.review.id ?? crypto.randomUUID();
    const supabase = createSupabaseServiceRoleClient();
    const uploadedPhotoPaths: string[] = [];

    if (files.length > 0) {
      for (const file of files) {
        const path = createProductReviewPhotoPath(reviewId, file.name);
        const upload = await supabase.storage
          .from(PRODUCT_REVIEW_BUCKET)
          .upload(path, await file.arrayBuffer(), {
            contentType: file.type || undefined,
            upsert: false,
          });

        if (upload.error) {
          if (uploadedPhotoPaths.length > 0) {
            await supabase.storage.from(PRODUCT_REVIEW_BUCKET).remove(uploadedPhotoPaths);
          }

          throw new Error(upload.error.message);
        }

        uploadedPhotoPaths.push(path);
      }
    }

    const nextPhotoPaths =
      uploadedPhotoPaths.length > 0 ? uploadedPhotoPaths : (existingReview?.review.photo_paths ?? []);

    const savedReview = await upsertProductReview({
      id: reviewId,
      customerEmail: user.email,
      customerName: user.name ?? null,
      reviewType,
      orderId: order.orderId,
      productSlug: order.productSlug,
      productName: order.productName,
      variantId: order.variantId,
      rating,
      title,
      review: reviewText,
      photoPaths: nextPhotoPaths,
      status: existingReview?.review.status ?? "pending",
    });

    if (existingReview && uploadedPhotoPaths.length > 0 && existingReview.review.photo_paths.length > 0) {
      await supabase.storage.from(PRODUCT_REVIEW_BUCKET).remove(existingReview.review.photo_paths);
    }

    return NextResponse.json(savedReview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save review.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
