import Link from "next/link";
import { requireCustomerUser } from "@/lib/customer-auth";
import { getCustomOrdersForCustomer } from "@/lib/custom-orders";
import { getCustomerOrdersWithDownloads } from "@/lib/orders";

function formatPrice(amountTotal: number | null, currency: string | null) {
  if (amountTotal === null || !currency) {
    return "Paid";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export const metadata = {
  title: "My Orders",
};

export default async function OrdersPage() {
  const { user } = await requireCustomerUser({ callbackUrl: "/orders" });
  const [orders, customOrders] = await Promise.all([
    getCustomerOrdersWithDownloads(user.email),
    getCustomOrdersForCustomer(user.email),
  ]);

  return (
    <div className="py-10">
      <section className="mx-auto max-w-4xl rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label w-fit text-[var(--brand-sky)]">My orders</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Previous purchases and downloads
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Signed in as <span className="font-bold">{user.email}</span>.
        </p>

        {orders.length === 0 && customOrders.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] bg-[var(--surface-pop)] px-5 py-5">
            <p className="font-bold text-[var(--brand-ink)]">No paid orders found yet.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If you already bought something, make sure you&apos;re signed in with the same email
              address you used during checkout.
            </p>
            <div className="mt-4">
              <Link href="/#shop" className="primary-button inline-flex">
                Browse printables
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map(({ order, downloads }) => (
              <article
                key={`${order.stripe_session_id}-${order.product_slug}-${order.variant_id}`}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(32,48,66,0.08)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">
                      {order.product_name}
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                      Purchased {formatDate(order.paid_at ?? order.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {order.variant_name} • {order.variant_page_count} pages • Quantity {order.quantity}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[var(--brand-ink)]">
                    {formatPrice(order.amount_total, order.currency)}
                  </p>
                </div>

                {downloads.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {downloads.map((download) => (
                      <a
                        key={`${order.stripe_session_id}-${download.path}`}
                        href={download.signedUrl}
                        className="rounded-[1.2rem] bg-[var(--surface-pop)] px-4 py-4 font-bold text-[var(--brand-ink)]"
                      >
                        Download {download.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-bold text-slate-600">
                    Downloads are not attached to this product yet. Contact support if you need
                    help.
                  </p>
                )}
              </article>
            ))}

            {customOrders.map(({ order, deliverables, sourceFileUrl }) => (
              <article
                key={order.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(32,48,66,0.08)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">
                      {order.product_name}
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                      Purchased {formatDate(order.paid_at ?? order.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {order.page_count} pages • {order.color_count} colors • {order.hex_width} hexes wide
                    </p>
                    <p className="mt-1 text-sm font-bold capitalize text-slate-600">
                      Status: {order.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[var(--brand-ink)]">
                    {formatPrice(order.amount_total, order.currency)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {sourceFileUrl ? (
                    <a
                      href={sourceFileUrl}
                      className="rounded-[1.2rem] bg-[var(--surface-pop)] px-4 py-4 font-bold text-[var(--brand-ink)]"
                    >
                      View uploaded file
                    </a>
                  ) : null}
                  {deliverables.map((deliverable) => (
                    <a
                      key={deliverable.path}
                      href={deliverable.signedUrl}
                      className="rounded-[1.2rem] bg-[var(--surface-pop)] px-4 py-4 font-bold text-[var(--brand-ink)]"
                    >
                      Download {deliverable.label}
                    </a>
                  ))}
                </div>

                {deliverables.length === 0 ? (
                  <p className="mt-4 text-sm font-bold text-slate-600">
                    Your finished custom files are not ready yet. We&apos;ll email you when they are available.
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
