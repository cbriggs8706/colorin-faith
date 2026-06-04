import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendCustomOrderAdminNotification } from "@/lib/custom-order-email";
import {
  getCustomOrderWithUrls,
  markCustomOrderAdminNotified,
  recordPaidCustomOrderFromCheckoutSession,
} from "@/lib/custom-orders";
import {
  getPurchasedItemsFromCheckoutSession,
  markReceiptEmailSent,
  recordPaidOrderFromCheckoutSession,
} from "@/lib/orders";
import {
  sendReceiptEmail,
  sendStandardOrderAdminNotification,
} from "@/lib/receipt-email";
import { constructStripeWebhookEvent } from "@/lib/stripe";

export const runtime = "nodejs";

async function handleStandardCheckoutSession(session: Stripe.Checkout.Session) {
  const [savedOrders, purchasedItems] = await Promise.all([
    recordPaidOrderFromCheckoutSession(session),
    getPurchasedItemsFromCheckoutSession(session),
  ]);
  const receiptWasAlreadySent = savedOrders.some((order) => Boolean(order.receipt_emailed_at));

  if (
    session.payment_status === "paid" &&
    savedOrders.length > 0 &&
    purchasedItems.length > 0 &&
    !receiptWasAlreadySent
  ) {
    try {
      await sendReceiptEmail({ session, purchasedItems });
      await markReceiptEmailSent(session.id);
    } catch (error) {
      console.error(`Unable to send receipt email for checkout session "${session.id}".`, error);
    }
  }

  if (session.payment_status === "paid" && savedOrders.length > 0 && purchasedItems.length > 0) {
    try {
      await sendStandardOrderAdminNotification({ session, purchasedItems });
    } catch (error) {
      console.error(
        `Unable to send admin notification for checkout session "${session.id}".`,
        error,
      );
    }
  }
}

async function handleCustomCheckoutSession(session: Stripe.Checkout.Session) {
  const customOrder = await recordPaidCustomOrderFromCheckoutSession(session);

  if (!customOrder || customOrder.admin_notified_at) {
    return;
  }

  const customOrderWithUrls = await getCustomOrderWithUrls(customOrder.id);

  if (!customOrderWithUrls) {
    return;
  }

  await sendCustomOrderAdminNotification(customOrderWithUrls);
  await markCustomOrderAdminNotified(customOrderWithUrls.order.id);
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.order_type === "custom") {
    await handleCustomCheckoutSession(session);
    return;
  }

  await handleStandardCheckoutSession(session);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = constructStripeWebhookEvent(payload, signature);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify Stripe webhook signature.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook failed for event "${event.id}".`, error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
