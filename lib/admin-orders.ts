import { getCustomerAuthSchema } from "@/lib/customer-auth-config";
import { getAllCustomOrdersWithUrls } from "@/lib/custom-orders";
import type { OrderRecord } from "@/lib/orders";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { CustomOrderWithUrls } from "@/lib/types";

export type AdminOrderAccountSummary = {
  email: string | null;
  hasAccount: boolean;
};

export type AdminStandardOrder = {
  order: OrderRecord;
  account: AdminOrderAccountSummary;
};

export type AdminCustomOrder = {
  order: CustomOrderWithUrls;
  account: AdminOrderAccountSummary;
};

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function mapStandardOrder(record: Partial<OrderRecord>) {
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

async function getCustomerAccountEmails() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .schema(getCustomerAuthSchema())
    .from("users")
    .select("email");

  if (error) {
    throw new Error(`Unable to load customer accounts: ${error.message}`);
  }

  return new Set(
    (data ?? [])
      .map((entry) => normalizeEmail(entry.email))
      .filter((email): email is string => Boolean(email)),
  );
}

export async function getAllStandardOrdersForAdmin() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load orders: ${error.message}`);
  }

  const accountEmails = await getCustomerAccountEmails();

  return ((data ?? []) as Partial<OrderRecord>[]).map((record) => {
    const order = mapStandardOrder(record);
    const email = normalizeEmail(order.customer_email);

    return {
      order,
      account: {
        email,
        hasAccount: email ? accountEmails.has(email) : false,
      },
    } satisfies AdminStandardOrder;
  });
}

export async function getAllCustomOrdersForAdmin() {
  const [orders, accountEmails] = await Promise.all([
    getAllCustomOrdersWithUrls(),
    getCustomerAccountEmails(),
  ]);

  return orders.map((order) => {
    const email = normalizeEmail(order.order.customer_email);

    return {
      order,
      account: {
        email,
        hasAccount: email ? accountEmails.has(email) : false,
      },
    } satisfies AdminCustomOrder;
  });
}
