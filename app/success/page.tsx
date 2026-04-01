import Link from "next/link";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { sendCustomOrderAdminNotification } from "@/lib/custom-order-email";
import {
  getCustomOrderWithUrls,
  markCustomOrderAdminNotified,
  recordPaidCustomOrderFromCheckoutSession,
} from "@/lib/custom-orders";
import { hasGoogleAuthProvider } from "@/lib/customer-auth-config";
import {
  getPurchasedItemsFromCheckoutSession,
  type OrderRecord,
  markReceiptEmailSent,
  recordPaidOrderFromCheckoutSession,
} from "@/lib/orders";
import { sendReceiptEmail } from "@/lib/receipt-email";
import { getCheckoutSession } from "@/lib/stripe";
import type { PurchasedItem } from "@/lib/types";

export const metadata = {
  title: "Order Success",
};

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  let session = null;

  if (sessionId) {
    try {
      session = await getCheckoutSession(sessionId);
    } catch (error) {
      console.error(`Unable to load Stripe checkout session "${sessionId}".`, error);
    }
  }

  let authSession = null;

  try {
    authSession = await auth();
  } catch (error) {
    console.error("Unable to load auth session on success page.", error);
  }

  const isPaid = session?.payment_status === "paid";
  const isCustomOrder = session?.metadata?.order_type === "custom";
  const checkoutEmail = session?.customer_details?.email ?? session?.customer_email ?? "";
  let purchasedItems: PurchasedItem[] = [];

  if (isPaid && session && !isCustomOrder) {
    try {
      purchasedItems = await getPurchasedItemsFromCheckoutSession(session);
    } catch (error) {
      console.error(`Unable to load purchased items for checkout session "${session.id}".`, error);
    }
  }

  const hasDownloads = purchasedItems.some((item) => item.downloads.length > 0);
  let savedOrders: OrderRecord[] = [];

  if (isPaid && session && !isCustomOrder) {
    try {
      savedOrders = await recordPaidOrderFromCheckoutSession(session);
    } catch (error) {
      console.error(`Unable to record paid order for checkout session "${session.id}".`, error);
    }
  }

  let customOrder = null;

  if (isPaid && session && isCustomOrder) {
    try {
      customOrder = await recordPaidCustomOrderFromCheckoutSession(session);
    } catch (error) {
      console.error(`Unable to record paid custom order for checkout session "${session.id}".`, error);
    }
  }

  let customOrderWithUrls = null;

  if (customOrder) {
    try {
      customOrderWithUrls = await getCustomOrderWithUrls(customOrder.id);
    } catch (error) {
      console.error(`Unable to load custom order URLs for order "${customOrder.id}".`, error);
    }
  }
  const receiptWasAlreadySent = savedOrders.some((order) => Boolean(order.receipt_emailed_at));
  const shouldEmailReceipt =
    isPaid &&
    Boolean(session) &&
    !isCustomOrder &&
    purchasedItems.length > 0 &&
    savedOrders.length > 0 &&
    !receiptWasAlreadySent;
  let receiptEmailSent = false;

  if (shouldEmailReceipt && session) {
    try {
      await sendReceiptEmail({ session, purchasedItems });
      await markReceiptEmailSent(session.id);
      receiptEmailSent = true;
    } catch (error) {
      console.error("Unable to send purchase receipt email.", error);
    }
  }

  if (customOrderWithUrls && !customOrderWithUrls.order.admin_notified_at) {
    try {
      await sendCustomOrderAdminNotification(customOrderWithUrls);
      await markCustomOrderAdminNotified(customOrderWithUrls.order.id);
    } catch (error) {
      console.error("Unable to send custom order admin notification.", error);
    }
  }

  const signedInWithMatchingEmail =
    Boolean(authSession?.user?.email) &&
    authSession?.user?.email?.trim().toLowerCase() === checkoutEmail.trim().toLowerCase();
  const ordersCallbackUrl = "/orders";

  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label mx-auto w-fit text-[var(--brand-mint)]">Payment complete</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Thank you for your order.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          {isPaid && isCustomOrder
            ? "Your custom order and upload are confirmed. We will review the file and notify you when the finished files are ready in your account."
            : isPaid && purchasedItems.length > 0
            ? "Your purchase is confirmed. Use the downloads below to grab your files."
            : "We could not verify this checkout session yet. If payment just completed, reload this page or contact support."}
        </p>

        {isPaid && checkoutEmail ? (
          <div className="mt-6 rounded-[1.5rem] bg-[var(--surface-pop)] px-5 py-5 text-left">
            <p className="font-black text-[var(--brand-ink)]">
              Want these files available later too?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Create or use an account with <span className="font-bold">{checkoutEmail}</span> so
              you can see this and other previous orders anytime.
            </p>

            {signedInWithMatchingEmail ? (
              <div className="mt-4">
                <Link className="primary-button inline-flex" href={ordersCallbackUrl}>
                  View my orders
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {hasGoogleAuthProvider() ? (
                  <GoogleSignInButton
                    callbackUrl={ordersCallbackUrl}
                    label="Continue with Google to save this order"
                  />
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="primary-button text-center"
                    href={`/signup?email=${encodeURIComponent(checkoutEmail)}&callbackUrl=${encodeURIComponent(
                      ordersCallbackUrl,
                    )}`}
                  >
                    Create account with password
                  </Link>
                  <Link
                    className="secondary-button text-center"
                    href={`/login?callbackUrl=${encodeURIComponent(ordersCallbackUrl)}`}
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {customOrderWithUrls ? (
          <article className="mt-6 rounded-[1.5rem] bg-[var(--surface-pop)] px-5 py-5 text-left">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">
              {customOrderWithUrls.order.product_name}
            </h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              {customOrderWithUrls.order.page_count} pages • {customOrderWithUrls.order.color_count} colors • {customOrderWithUrls.order.hex_width} hexes wide
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              We received your upload and your order now appears in your account history. Finished files will show up there once they are delivered.
            </p>
            {customOrderWithUrls.sourceFileUrl ? (
              <a
                className="primary-button mt-4 inline-flex"
                href={customOrderWithUrls.sourceFileUrl}
              >
                View uploaded file
              </a>
            ) : null}
          </article>
        ) : null}

        {purchasedItems.length > 0 ? (
          <div className="mt-6 space-y-4 text-left">
            {purchasedItems.map((item) => (
              <article
                key={`${item.slug}-${item.variantId}`}
                className="rounded-[1.5rem] bg-[var(--surface-pop)] px-5 py-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">
                      {item.name}
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                      {item.variantName} • {item.pageCount} pages • Quantity {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {item.downloads.length > 0 ? (
                    item.downloads.map((download) => (
                      <a
                        key={`${item.slug}-${download.path}`}
                        className="rounded-[1.2rem] bg-white px-4 py-4 font-bold text-[var(--brand-ink)]"
                        href={download.signedUrl}
                      >
                        Download {download.label}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-slate-600">
                      No download files are attached to this product yet.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {isPaid && purchasedItems.length > 0 && !hasDownloads ? (
          <p className="mt-6 text-sm font-bold text-slate-600">
            Download files are not attached to these products yet.
          </p>
        ) : null}

        {savedOrders.length > 0 && signedInWithMatchingEmail ? (
          <p className="mt-6 text-sm font-bold text-slate-600">
            This purchase was added to your order history.
          </p>
        ) : null}

        {customOrderWithUrls && signedInWithMatchingEmail ? (
          <p className="mt-6 text-sm font-bold text-slate-600">
            This custom order was added to your order history.
          </p>
        ) : null}

        {(receiptEmailSent || receiptWasAlreadySent) && checkoutEmail ? (
          <p className="mt-4 text-sm font-bold text-slate-600">
            A receipt and secure download link were emailed to {checkoutEmail}.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="primary-button" href="/#shop">
            Continue browsing
          </Link>
          <Link className="secondary-button" href="/contact">
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}
