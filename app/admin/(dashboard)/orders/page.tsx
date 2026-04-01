import Link from "next/link";
import { AdminCustomOrderManager } from "@/components/admin-custom-order-manager";
import { getAllCustomOrdersForAdmin, getAllStandardOrdersForAdmin } from "@/lib/admin-orders";
import { getAllCustomOrdersWithUrls } from "@/lib/custom-orders";

export const metadata = {
  title: "Orders Admin",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return "Amount unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function getAccountBadge(hasAccount: boolean, email: string | null) {
  if (!email) {
    return {
      label: "Unknown account",
      tone: "text-slate-600 bg-slate-100",
    };
  }

  if (hasAccount) {
    return {
      label: "Account holder",
      tone: "text-[var(--brand-ink)] bg-[rgba(157,196,120,0.24)]",
    };
  }

  return {
    label: "Guest checkout",
    tone: "text-[var(--brand-ink)] bg-[rgba(255,181,167,0.3)]",
  };
}

export default async function AdminOrdersPage() {
  const [standardOrders, customOrders, customOrdersWithUrls] = await Promise.all([
    getAllStandardOrdersForAdmin(),
    getAllCustomOrdersForAdmin(),
    getAllCustomOrdersWithUrls(),
  ]);
  const customOrderAccountStatusById = Object.fromEntries(
    customOrders.map((entry) => [
      entry.order.order.id,
      getAccountBadge(entry.account.hasAccount, entry.account.email),
    ]),
  );

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="pill-label w-fit text-[var(--brand-coral)]">Sales admin</p>
          <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)]">
            Orders, custom jobs, and account status
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Use this screen to review every purchase, check custom-order progress, and confirm
            whether the customer created an account tied to the checkout email.
          </p>
        </div>
        <Link className="secondary-button" href="/admin/custom-order">
          Open custom product settings
        </Link>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
            Product orders
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">{standardOrders.length}</p>
        </div>
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
            Custom orders
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">{customOrders.length}</p>
        </div>
        <div className="card-surface rounded-[1.75rem] px-5 py-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-mint)]">
            Account-linked orders
          </p>
          <p className="mt-3 text-4xl font-black text-[var(--brand-ink)]">
            {standardOrders.filter((entry) => entry.account.hasAccount).length +
              customOrders.filter((entry) => entry.account.hasAccount).length}
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-sky)]">Standard orders</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)]">
            Product purchases
          </h2>
        </div>

        {standardOrders.length === 0 ? (
          <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
            <p className="font-bold text-slate-700">No product orders yet.</p>
          </div>
        ) : (
          standardOrders.map((entry) => {
            const accountBadge = getAccountBadge(entry.account.hasAccount, entry.account.email);

            return (
              <article
                key={`${entry.order.stripe_session_id}-${entry.order.product_slug}-${entry.order.variant_id}`}
                className="card-surface rounded-[2rem] px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-sky)]">
                        {entry.order.product_name}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                        {entry.order.payment_status}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${accountBadge.tone}`}
                      >
                        {accountBadge.label}
                      </span>
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-[var(--brand-ink)]">
                      {entry.order.customer_name ?? entry.order.customer_email}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-slate-600">{entry.order.customer_email}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Variant: {entry.order.variant_name} • {entry.order.variant_page_count} pages
                    </p>
                    <p className="text-sm leading-6 text-slate-700">
                      Quantity: {entry.order.quantity} • {formatMoney(entry.order.amount_total, entry.order.currency)}
                    </p>
                    <p className="text-sm leading-6 text-slate-700">
                      Ordered {formatDateTime(entry.order.created_at)} • Paid {formatDate(entry.order.paid_at)}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm text-slate-700 lg:min-w-64">
                    <p className="font-black text-[var(--brand-ink)]">Order details</p>
                    <p className="mt-2 break-all">
                      Session: <span className="font-semibold">{entry.order.stripe_session_id}</span>
                    </p>
                    <p className="mt-1">
                      Receipt emailed: {entry.order.receipt_emailed_at ? formatDate(entry.order.receipt_emailed_at) : "No"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-5">
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="pill-label w-fit text-[var(--brand-berry)]">Custom orders</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)]">
            Uploaded custom jobs
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            This is now the fulfillment workspace for custom orders. Review the customer upload,
            upload finished files, update status, and send the ready email from here.
          </p>
        </div>

        <AdminCustomOrderManager
          accountStatusByOrderId={customOrderAccountStatusById}
          initialOrders={customOrdersWithUrls}
        />
      </section>
    </div>
  );
}
