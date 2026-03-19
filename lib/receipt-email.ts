import type Stripe from "stripe";
import type { PurchasedItem } from "@/lib/types";
import {
  getReceiptFromEmail,
  getResendApiKey,
  getSiteUrl,
} from "@/lib/supabase/env";

function formatPrice(amountTotal: number | null, currency: string | null) {
  if (amountTotal === null || !currency) {
    return "Paid";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100);
}

function formatDate(unixTimestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(unixTimestamp * 1000));
}

type SendReceiptEmailInput = {
  session: Stripe.Checkout.Session;
  purchasedItems: PurchasedItem[];
};

export async function sendReceiptEmail({
  session,
  purchasedItems,
}: SendReceiptEmailInput) {
  const customerEmail = session.customer_details?.email ?? session.customer_email;

  if (!customerEmail) {
    throw new Error("Missing customer email for receipt.");
  }

  const customerName = session.customer_details?.name?.trim();
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";
  const downloadPageUrl = `${getSiteUrl()}/success?session_id=${encodeURIComponent(session.id)}`;
  const productList = purchasedItems
    .map((item) => `- ${item.name} (${item.variantName}, ${item.pageCount} pages) x${item.quantity}`)
    .join("\n");
  const downloadList = purchasedItems
    .flatMap((item) =>
      item.downloads.length > 0
        ? item.downloads.map(
            (download) => `- ${item.name} (${item.variantName}): ${download.label}`,
          )
        : [`- ${item.name} (${item.variantName}): files will appear on the download page once attached.`],
    )
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getReceiptFromEmail(),
      to: [customerEmail],
      subject: "Your Color in Faith receipt",
      text: [
        greeting,
        "",
        "Thanks for your purchase from Color in Faith.",
        `Order date: ${formatDate(session.created)}`,
        `Amount paid: ${formatPrice(session.amount_total ?? null, session.currency ?? null)}`,
        `Receipt number: ${session.id}`,
        "",
        "Items purchased:",
        productList,
        "",
        "Your downloads:",
        downloadList,
        "",
        `Download page: ${downloadPageUrl}`,
        "",
        "If you have any trouble accessing your files, reply to this email or contact support through the site.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? "Unable to send receipt email.");
  }
}
