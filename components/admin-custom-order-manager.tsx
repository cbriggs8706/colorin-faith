"use client";

import { useState } from "react";
import { CUSTOM_ORDER_STATUSES, type CustomOrderWithUrls } from "@/lib/types";

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

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !currency) {
    return "Paid";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function AdminCustomOrderManager({
  initialOrders,
  accountStatusByOrderId,
}: {
  initialOrders: CustomOrderWithUrls[];
  accountStatusByOrderId?: Record<string, { label: string; tone: string }>;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function syncOrder(nextOrder: CustomOrderWithUrls) {
    setOrders((current) =>
      current
        .map((entry) => (entry.order.id === nextOrder.order.id ? nextOrder : entry))
        .sort(
          (left, right) =>
            new Date(right.order.updated_at).getTime() - new Date(left.order.updated_at).getTime(),
        ),
    );
  }

  async function updateStatus(id: string, nextStatus: string) {
    setBusyId(id);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`/api/admin/custom-orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as CustomOrderWithUrls & { error?: string };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to update order status.");
      }

      syncOrder(payload);
      setStatus("Order status updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update order status.");
    } finally {
      setBusyId(null);
    }
  }

  async function uploadDeliverable(id: string, file: File) {
    setBusyId(id);
    setError("");
    setStatus("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("label", file.name);

      const response = await fetch(`/api/admin/custom-orders/${id}/assets`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as CustomOrderWithUrls & { error?: string };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to upload deliverable.");
      }

      syncOrder(payload);
      setStatus("Finished file uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload deliverable.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeDeliverable(id: string, path: string) {
    setBusyId(id);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`/api/admin/custom-orders/${id}/assets`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
      const payload = (await response.json()) as CustomOrderWithUrls & { error?: string };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to remove deliverable.");
      }

      syncOrder(payload);
      setStatus("Finished file removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove deliverable.");
    } finally {
      setBusyId(null);
    }
  }

  async function sendReadyEmail(id: string) {
    setBusyId(id);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`/api/admin/custom-orders/${id}/notify-ready`, {
        method: "POST",
      });
      const payload = (await response.json()) as CustomOrderWithUrls & { error?: string };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to send ready email.");
      }

      syncOrder(payload);
      setStatus("Ready email sent.");
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "Unable to send ready email.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Custom orders</p>
        <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)]">
          Review uploads, update statuses, and deliver finished files
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
          <p className="font-bold text-slate-700">No custom orders yet.</p>
        </div>
      ) : (
        orders.map((entry) => (
          <article
            key={entry.order.id}
            className="card-surface rounded-[2rem] px-5 py-6 shadow-[0_24px_60px_rgba(32,48,66,0.12)] sm:px-7"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
                    {entry.order.product_name}
                  </p>
                  {accountStatusByOrderId?.[entry.order.id] ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${accountStatusByOrderId[entry.order.id].tone}`}
                    >
                      {accountStatusByOrderId[entry.order.id].label}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">
                  {entry.order.customer_name ?? entry.order.customer_email ?? "Pending customer details"}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  {entry.order.customer_email ?? "Email will appear after checkout is completed"}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {entry.order.page_count} pages • {entry.order.color_count} colors • {entry.order.hex_width} hexes wide
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  {formatMoney(entry.order.amount_total, entry.order.currency)} • {entry.order.payment_status}
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  Created {formatDate(entry.order.created_at)} • Paid {formatDate(entry.order.paid_at)}
                </p>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[var(--brand-ink)]">Status</span>
                <select
                  className="rounded-[1rem] border border-slate-200 px-4 py-3"
                  disabled={busyId === entry.order.id}
                  onChange={(event) => void updateStatus(entry.order.id, event.target.value)}
                  value={entry.order.status}
                >
                  {CUSTOM_ORDER_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white/80 px-4 py-4">
                <p className="font-black text-[var(--brand-ink)]">Customer upload</p>
                <p className="mt-2 text-sm text-slate-600">{entry.order.source_file_name}</p>
                {entry.sourceFileUrl ? (
                  <a className="primary-button mt-4 inline-flex" href={entry.sourceFileUrl}>
                    Download uploaded file
                  </a>
                ) : (
                  <p className="mt-3 text-sm font-bold text-slate-600">Source file link unavailable.</p>
                )}
              </div>

              <div className="rounded-[1.5rem] bg-white/80 px-4 py-4">
                <p className="font-black text-[var(--brand-ink)]">Finished files</p>
                <label className="mt-3 grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Upload deliverable</span>
                  <input
                    className="rounded-[1rem] border border-slate-200 px-4 py-3"
                    disabled={busyId === entry.order.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void uploadDeliverable(entry.order.id, file);
                      }
                    }}
                    type="file"
                  />
                </label>
                <div className="mt-4 space-y-3">
                  {entry.deliverables.length > 0 ? (
                    entry.deliverables.map((deliverable) => (
                      <div
                        key={deliverable.path}
                        className="flex flex-col gap-2 rounded-[1rem] border border-slate-200 px-4 py-4"
                      >
                        <a className="font-bold text-[var(--brand-ink)]" href={deliverable.signedUrl}>
                          {deliverable.label}
                        </a>
                        <button
                          className="secondary-button w-fit px-4 py-2 text-sm"
                          disabled={busyId === entry.order.id}
                          onClick={() => void removeDeliverable(entry.order.id, deliverable.path)}
                          type="button"
                        >
                          Remove file
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-slate-600">No deliverables uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="primary-button"
                disabled={busyId === entry.order.id || entry.deliverables.length === 0}
                onClick={() => void sendReadyEmail(entry.order.id)}
                type="button"
              >
                {entry.order.ready_email_sent_at ? "Send ready email again" : "Send ready email"}
              </button>
              <p className="self-center text-sm font-bold text-slate-600">
                Last ready email: {formatDate(entry.order.ready_email_sent_at)}
              </p>
            </div>
          </article>
        ))
      )}

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {status ? <p className="text-sm font-bold text-[var(--brand-mint)]">{status}</p> : null}
    </section>
  );
}
