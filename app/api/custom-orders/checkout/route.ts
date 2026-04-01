import { NextResponse } from "next/server";
import {
  CUSTOM_ORDER_MAX_FILE_SIZE,
  createCustomOrderStoragePath,
  isAllowedCustomOrderFile,
  CUSTOM_ORDER_BUCKET,
} from "@/lib/custom-order-assets";
import { createCustomOrder, updateCustomOrderSourceFile } from "@/lib/custom-orders";
import { getCustomProduct } from "@/lib/custom-product-store";
import { getStripe } from "@/lib/stripe";
import { hasSupabaseDatabaseEnv, getSiteUrl } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import {
  CUSTOM_PRODUCT_COLOR_COUNTS,
  CUSTOM_PRODUCT_HEX_WIDTH_MAX,
  CUSTOM_PRODUCT_HEX_WIDTH_MIN,
  CUSTOM_PRODUCT_PAGE_COUNTS,
} from "@/lib/types";

export async function POST(request: Request) {
  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase storage must be configured before selling custom orders." },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const pageCount = Number(formData.get("pageCount"));
    const colorCount = Number(formData.get("colorCount"));
    const hexWidth = Number(formData.get("hexWidth"));
    const acknowledgement = String(formData.get("acknowledgement") ?? "");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a photo or PDF first." }, { status: 400 });
    }

    if (!CUSTOM_PRODUCT_PAGE_COUNTS.includes(pageCount as (typeof CUSTOM_PRODUCT_PAGE_COUNTS)[number])) {
      return NextResponse.json({ error: "Choose a valid page count." }, { status: 400 });
    }

    if (!CUSTOM_PRODUCT_COLOR_COUNTS.includes(colorCount as (typeof CUSTOM_PRODUCT_COLOR_COUNTS)[number])) {
      return NextResponse.json({ error: "Choose a valid color count." }, { status: 400 });
    }

    if (
      !Number.isInteger(hexWidth) ||
      hexWidth < CUSTOM_PRODUCT_HEX_WIDTH_MIN ||
      hexWidth > CUSTOM_PRODUCT_HEX_WIDTH_MAX
    ) {
      return NextResponse.json({ error: "Choose a valid hex width." }, { status: 400 });
    }

    if (acknowledgement !== "true") {
      return NextResponse.json(
        { error: "Please confirm that you have permission to use this image." },
        { status: 400 },
      );
    }

    if (file.size > CUSTOM_ORDER_MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 400 });
    }

    if (!isAllowedCustomOrderFile(file)) {
      return NextResponse.json({ error: "Upload a PDF or supported image file." }, { status: 400 });
    }

    const product = await getCustomProduct();
    const pagePrice = product.pagePrices.find((entry) => entry.pageCount === pageCount);

    if (!product.active) {
      return NextResponse.json({ error: "This custom product is not currently available." }, { status: 400 });
    }

    if (!pagePrice?.stripePriceId) {
      return NextResponse.json(
        { error: `This page count is not set up in Stripe yet.` },
        { status: 400 },
      );
    }

    const placeholderOrder = await createCustomOrder({
      productSlug: product.slug,
      productName: product.name,
      pageCount,
      colorCount,
      hexWidth,
      sourceFilePath: "",
      sourceFileName: file.name,
      sourceFileContentType: file.type || null,
    });

    const storagePath = createCustomOrderStoragePath(placeholderOrder.id, "source", file.name);
    const supabase = createSupabaseServiceRoleClient();
    const buffer = await file.arrayBuffer();
    const upload = await supabase.storage.from(CUSTOM_ORDER_BUCKET).upload(storagePath, buffer, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    await updateCustomOrderSourceFile(placeholderOrder.id, {
      path: storagePath,
      name: file.name,
      contentType: file.type || null,
    });

    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/custom-order?canceled=1`,
      line_items: [
        {
          price: pagePrice.stripePriceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        order_type: "custom",
        custom_order_id: placeholderOrder.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start custom checkout.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
