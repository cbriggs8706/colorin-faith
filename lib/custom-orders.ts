import { promises as fs } from "node:fs";
import path from "node:path";
import type Stripe from "stripe";
import { createSignedUrl } from "@/lib/custom-order-links";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import {
  CUSTOM_ORDER_STATUSES,
  type CustomOrderDeliverable,
  type CustomOrderRecord,
  type CustomOrderStatus,
  type CustomOrderWithUrls,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const customOrdersPath = path.join(dataDirectory, "custom-orders.json");

type CreateCustomOrderInput = {
  productSlug: string;
  productName: string;
  pageCount: number;
  colorCount: number;
  hexWidth: number;
  sourceFilePath: string;
  sourceFileName: string;
  sourceFileContentType: string | null;
};

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(customOrdersPath);
  } catch {
    await fs.writeFile(customOrdersPath, "[]", "utf8");
  }
}

async function readFallbackOrders() {
  await ensureDataFile();
  const file = await fs.readFile(customOrdersPath, "utf8");
  return JSON.parse(file) as CustomOrderRecord[];
}

async function writeFallbackOrders(orders: CustomOrderRecord[]) {
  await ensureDataFile();
  await fs.writeFile(customOrdersPath, JSON.stringify(orders, null, 2), "utf8");
}

function normalizeStatus(status: string): CustomOrderStatus {
  return (CUSTOM_ORDER_STATUSES as readonly string[]).includes(status)
    ? (status as CustomOrderStatus)
    : "received";
}

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function mapRecord(record: CustomOrderRecord) {
  return {
    ...record,
    status: normalizeStatus(record.status),
    deliverables: record.deliverables ?? [],
  } satisfies CustomOrderRecord;
}

function sortOrders(left: CustomOrderRecord, right: CustomOrderRecord) {
  return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
}

async function withSignedUrls(order: CustomOrderRecord): Promise<CustomOrderWithUrls> {
  const sourceFileUrl = await createSignedUrl(order.source_file_path);
  const deliverables = await Promise.all(
    (order.deliverables ?? []).map(async (deliverable) => {
      const signedUrl = await createSignedUrl(deliverable.path);

      if (!signedUrl) {
        return null;
      }

      return {
        ...deliverable,
        signedUrl,
      };
    }),
  );

  return {
    order,
    sourceFileUrl,
    deliverables: deliverables.filter(Boolean) as Array<CustomOrderDeliverable & { signedUrl: string }>,
  };
}

export async function createCustomOrder(input: CreateCustomOrderInput) {
  const timestamp = new Date().toISOString();
  const order: CustomOrderRecord = {
    id: crypto.randomUUID(),
    stripe_session_id: null,
    customer_email: null,
    customer_name: null,
    product_slug: input.productSlug,
    product_name: input.productName,
    page_count: input.pageCount,
    color_count: input.colorCount,
    hex_width: input.hexWidth,
    source_file_path: input.sourceFilePath,
    source_file_name: input.sourceFileName,
    source_file_content_type: input.sourceFileContentType,
    permission_confirmed: true,
    status: "received",
    deliverables: [],
    amount_total: null,
    currency: null,
    payment_status: "unpaid",
    paid_at: null,
    admin_notified_at: null,
    ready_email_sent_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_orders")
      .insert(order)
      .select()
      .single();

    if (error) {
      throw new Error(`Unable to create custom order: ${error.message}`);
    }

    return mapRecord(data as CustomOrderRecord);
  }

  const orders = await readFallbackOrders();
  orders.unshift(order);
  await writeFallbackOrders(orders);
  return order;
}

export async function getCustomOrderById(id: string) {
  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load custom order: ${error.message}`);
    }

    return data ? mapRecord(data as CustomOrderRecord) : null;
  }

  const orders = await readFallbackOrders();
  return orders.find((order) => order.id === id) ?? null;
}

export async function getCustomOrderWithUrls(id: string) {
  const order = await getCustomOrderById(id);
  return order ? withSignedUrls(order) : null;
}

export async function getAllCustomOrders() {
  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_orders")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load custom orders: ${error.message}`);
    }

    return ((data ?? []) as CustomOrderRecord[]).map(mapRecord);
  }

  const orders = await readFallbackOrders();
  return orders.map(mapRecord).sort(sortOrders);
}

export async function getAllCustomOrdersWithUrls() {
  const orders = await getAllCustomOrders();
  return Promise.all(orders.map(withSignedUrls));
}

export async function getCustomOrdersForCustomer(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("customer_email", normalizedEmail)
      .eq("payment_status", "paid")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load custom orders: ${error.message}`);
    }

    return Promise.all(((data ?? []) as CustomOrderRecord[]).map((order) => withSignedUrls(mapRecord(order))));
  }

  const orders = await readFallbackOrders();
  return Promise.all(
    orders
      .filter(
        (order) =>
          normalizeEmail(order.customer_email) === normalizedEmail && order.payment_status === "paid",
      )
      .sort(sortOrders)
      .map((order) => withSignedUrls(mapRecord(order))),
  );
}

async function persistUpdate(updatedOrder: CustomOrderRecord) {
  if (hasSupabaseDatabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("custom_orders")
      .update(updatedOrder)
      .eq("id", updatedOrder.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Unable to save custom order: ${error.message}`);
    }

    return mapRecord(data as CustomOrderRecord);
  }

  const orders = await readFallbackOrders();
  const nextOrders = orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order));
  await writeFallbackOrders(nextOrders);
  return updatedOrder;
}

export async function updateCustomOrderStatus(id: string, status: CustomOrderStatus) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function addCustomOrderDeliverable(
  id: string,
  deliverable: CustomOrderDeliverable,
) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    deliverables: [...order.deliverables, deliverable],
    updated_at: new Date().toISOString(),
  });
}

export async function removeCustomOrderDeliverable(id: string, path: string) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    deliverables: order.deliverables.filter((deliverable) => deliverable.path !== path),
    updated_at: new Date().toISOString(),
  });
}

export async function recordPaidCustomOrderFromCheckoutSession(session: Stripe.Checkout.Session) {
  const customOrderId = session.metadata?.custom_order_id ?? "";

  if (!customOrderId) {
    return null;
  }

  const order = await getCustomOrderById(customOrderId);

  if (!order) {
    throw new Error("Custom order was not found.");
  }

  return persistUpdate({
    ...order,
    stripe_session_id: session.id,
    customer_email: normalizeEmail(session.customer_details?.email ?? session.customer_email ?? null),
    customer_name: session.customer_details?.name ?? null,
    amount_total: session.amount_total ?? null,
    currency: session.currency ?? null,
    payment_status: session.payment_status ?? "unpaid",
    paid_at:
      session.payment_status === "paid"
        ? new Date(session.created * 1000).toISOString()
        : null,
    updated_at: new Date().toISOString(),
  });
}

export async function updateCustomOrderSourceFile(
  id: string,
  input: { path: string; name: string; contentType: string | null },
) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    source_file_path: input.path,
    source_file_name: input.name,
    source_file_content_type: input.contentType,
    updated_at: new Date().toISOString(),
  });
}

export async function markCustomOrderAdminNotified(id: string) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    admin_notified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function markCustomOrderReadyEmailSent(id: string) {
  const order = await getCustomOrderById(id);

  if (!order) {
    throw new Error("Custom order not found.");
  }

  return persistUpdate({
    ...order,
    ready_email_sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
