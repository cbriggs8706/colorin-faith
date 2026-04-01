import type Stripe from "stripe";
import { createSignedDownloadLinks } from "@/lib/product-assets-server";
import { getProducts } from "@/lib/store";
import { getCheckoutSessionLineItems } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { PurchasedItem } from "@/lib/types";

export type OrderRecord = {
  stripe_session_id: string;
  customer_email: string;
  customer_name: string | null;
  product_slug: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  variant_page_count: number;
  quantity: number;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  paid_at: string | null;
  receipt_emailed_at: string | null;
  created_at: string;
};

export type CustomerOrder = {
  order: OrderRecord;
  downloads: Array<{ label: string; path: string; signedUrl: string }>;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapOrderRecord(record: Partial<OrderRecord>) {
  return {
    stripe_session_id: record.stripe_session_id ?? "",
    customer_email: record.customer_email ?? "",
    customer_name: record.customer_name ?? null,
    product_slug: record.product_slug ?? "",
    product_name: record.product_name ?? "",
    variant_id: record.variant_id ?? "standard",
    variant_name: record.variant_name ?? "Standard",
    variant_page_count: record.variant_page_count ?? 1,
    quantity: record.quantity ?? 1,
    amount_total: record.amount_total ?? null,
    currency: record.currency ?? null,
    payment_status: record.payment_status ?? "unpaid",
    paid_at: record.paid_at ?? null,
    receipt_emailed_at: record.receipt_emailed_at ?? null,
    created_at: record.created_at ?? new Date(0).toISOString(),
  } satisfies OrderRecord;
}

function stripLegacyMissingColumns(
  payload: Array<Record<string, string | number | null>>,
  message: string,
) {
  const nextPayload = payload.map((entry) => ({ ...entry }));
  let changed = false;

  for (const column of ["quantity", "variant_id", "variant_name", "variant_page_count"]) {
    if (message.includes(`Could not find the '${column}' column`)) {
      changed = true;

      for (const entry of nextPayload) {
        delete entry[column];
      }
    }
  }

  return changed ? nextPayload : null;
}

async function upsertOrders(
  payload: Array<Record<string, string | number | null>>,
  onConflict: string,
) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .upsert(payload, { onConflict })
    .select();

  return { data, error };
}

export async function getPurchasedItemsFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<PurchasedItem[]> {
  const products = await getProducts();
  const productsByPriceId = new Map(
    products.flatMap((product) =>
      product.variants
        .filter((variant) => variant.stripePriceId)
        .map((variant) => [variant.stripePriceId, { product, variant }] as const),
    ),
  );
  const lineItems = await getCheckoutSessionLineItems(session.id);

  const purchasedItems = await Promise.all(
    lineItems.map(async (lineItem) => {
      const priceId =
        typeof lineItem.price === "string" ? lineItem.price : lineItem.price?.id ?? "";
      const match = productsByPriceId.get(priceId);

      if (!match) {
        return null;
      }

      const { product, variant } = match;

      return {
        slug: product.slug,
        name: product.name,
        variantId: variant.id,
        variantName: variant.name,
        pageCount: variant.pageCount,
        quantity: Math.max(1, lineItem.quantity ?? 1),
        amountTotal: lineItem.amount_total ?? null,
        downloads: await createSignedDownloadLinks(variant.downloads),
      } satisfies PurchasedItem;
    }),
  );

  return purchasedItems.filter((item) => item !== null);
}

export async function recordPaidOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const sessionId = session.id;
  const customerEmail = session.customer_details?.email ?? session.customer_email;

  if (!sessionId || !customerEmail) {
    return [];
  }

  const purchasedItems = await getPurchasedItemsFromCheckoutSession(session);

  if (purchasedItems.length === 0) {
    return [];
  }

  const payload = purchasedItems.map((item) => ({
    stripe_session_id: sessionId,
    customer_email: normalizeEmail(customerEmail),
    customer_name: session.customer_details?.name ?? null,
    product_slug: item.slug,
    product_name: item.name,
    variant_id: item.variantId,
    variant_name: item.variantName,
    variant_page_count: item.pageCount,
    quantity: item.quantity,
    amount_total: item.amountTotal,
    currency: session.currency ?? null,
    payment_status: session.payment_status ?? "unpaid",
    paid_at:
      session.payment_status === "paid"
        ? new Date(session.created * 1000).toISOString()
        : null,
  }));
  let { data, error } = await upsertOrders(payload, "stripe_session_id,product_slug,variant_id");

  if (error) {
    const legacyPayload = stripLegacyMissingColumns(payload, error.message);

    if (legacyPayload) {
      ({ data, error } = await upsertOrders(legacyPayload, "stripe_session_id,product_slug"));
    } else if (error.message.includes("no unique or exclusion constraint matching the ON CONFLICT")) {
      ({ data, error } = await upsertOrders(payload, "stripe_session_id,product_slug"));
    }
  }

  if (error) {
    throw new Error(`Unable to save order: ${error.message}`);
  }

  return ((data ?? []) as Partial<OrderRecord>[]).map(mapOrderRecord);
}

export async function markReceiptEmailSent(sessionId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ receipt_emailed_at: timestamp })
    .eq("stripe_session_id", sessionId)
    .select();

  if (error) {
    throw new Error(`Unable to mark receipt email as sent: ${error.message}`);
  }

  return ((data ?? []) as Partial<OrderRecord>[]).map(mapOrderRecord);
}

export async function getOrdersForCustomerEmail(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_email", normalizeEmail(email))
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load orders: ${error.message}`);
  }

  return ((data ?? []) as Partial<OrderRecord>[]).map(mapOrderRecord);
}

export async function getCustomerOrdersWithDownloads(email: string) {
  const orders = await getOrdersForCustomerEmail(email);
  const products = await getProducts();
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));

  return Promise.all(
    orders.map(async (order) => {
      const product = productsBySlug.get(order.product_slug);
      const variant = product?.variants.find((entry) => entry.id === order.variant_id);
      const downloads = variant ? await createSignedDownloadLinks(variant.downloads) : [];

      return {
        order,
        downloads,
      } satisfies CustomerOrder;
    }),
  );
}
