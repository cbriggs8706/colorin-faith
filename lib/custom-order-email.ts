import {
  getAdminEmails,
  getContactFromEmail,
  getReceiptFromEmail,
  getResendApiKey,
  getSiteUrl,
} from "@/lib/supabase/env";
import type { CustomOrderWithUrls } from "@/lib/types";

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return "Paid";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function sendEmail(payload: {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "Unable to send email.");
  }
}

export async function sendCustomOrderAdminNotification(order: CustomOrderWithUrls) {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    throw new Error("Missing ADMIN_EMAILS environment variable.");
  }

  await sendEmail({
    from: getContactFromEmail(),
    to: adminEmails,
    replyTo: order.order.customer_email ?? undefined,
    subject: `New custom order from ${order.order.customer_name ?? order.order.customer_email ?? "customer"}`,
    text: [
      "A new paid custom order was placed.",
      "",
      `Order ID: ${order.order.id}`,
      `Customer: ${order.order.customer_name ?? "Unknown"}`,
      `Email: ${order.order.customer_email ?? "Unknown"}`,
      `Pages: ${order.order.page_count}`,
      `Colors: ${order.order.color_count}`,
      `Hexes wide: ${order.order.hex_width}`,
      `Amount paid: ${formatMoney(order.order.amount_total, order.order.currency)}`,
      "",
      order.sourceFileUrl ? `Reference file: ${order.sourceFileUrl}` : "Reference file uploaded.",
      `${getSiteUrl()}/admin/custom-order`,
    ].join("\n"),
  });
}

export async function sendCustomOrderReadyEmail(order: CustomOrderWithUrls) {
  const customerEmail = order.order.customer_email;

  if (!customerEmail) {
    throw new Error("Custom order is missing a customer email.");
  }

  await sendEmail({
    from: getReceiptFromEmail(),
    to: [customerEmail],
    subject: "Your custom Color in Faith order is ready",
    text: [
      order.order.customer_name ? `Hi ${order.order.customer_name},` : "Hello,",
      "",
      "Your custom Color in Faith order is ready to download.",
      `Order ID: ${order.order.id}`,
      `Pages: ${order.order.page_count}`,
      `Colors: ${order.order.color_count}`,
      `Hexes wide: ${order.order.hex_width}`,
      "",
      "Sign in with the same email used at checkout to access your files:",
      `${getSiteUrl()}/orders`,
      "",
      "If you need any help, just reply to this email.",
    ].join("\n"),
  });
}

export async function sendCustomOrderReceiptEmail(order: CustomOrderWithUrls) {
  const customerEmail = order.order.customer_email;

  if (!customerEmail) {
    throw new Error("Custom order is missing a customer email.");
  }

  await sendEmail({
    from: getReceiptFromEmail(),
    to: [customerEmail],
    subject: "Your Color in Faith custom order receipt",
    text: [
      order.order.customer_name ? `Hi ${order.order.customer_name},` : "Hello,",
      "",
      "Thanks for your custom order from Color in Faith.",
      `Order ID: ${order.order.id}`,
      `Amount paid: ${formatMoney(order.order.amount_total, order.order.currency)}`,
      "",
      "Order details:",
      `- ${order.order.page_count} pages`,
      `- ${order.order.color_count} colors`,
      `- ${order.order.hex_width} hexes wide`,
      "",
      "We received your upload and will notify you when your finished files are ready in your account.",
      `${getSiteUrl()}/orders`,
    ].join("\n"),
  });
}
