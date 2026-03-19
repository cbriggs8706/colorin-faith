"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CartPageClient({ products }: { products: Product[] }) {
  const { items, setQuantity, removeItem, clearCart } = useCart();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const detailedItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((entry) => entry.slug === item.slug);
          const variant = product?.variants.find((entry) => entry.id === item.variantId);

          if (!product || !variant) {
            return null;
          }

          return {
            item,
            product,
            variant,
            lineTotal: variant.price * item.quantity,
          };
        })
        .filter(
          (entry): entry is {
            item: (typeof items)[number];
            product: Product;
            variant: Product["variants"][number];
            lineTotal: number;
          } => entry !== null,
        ),
    [items, products],
  );

  const subtotal = detailedItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

  async function handleCheckout() {
    if (detailedItems.length === 0) {
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: detailedItems.map(({ item }) => ({
            slug: item.slug,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      clearCart();
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.",
      );
      setIsPending(false);
    }
  }

  if (detailedItems.length === 0) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label mx-auto w-fit text-[var(--brand-sky)]">Your cart</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Your cart is empty.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Add a few printables, then come back here when you&apos;re ready to
          check out.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/#shop" className="primary-button">
            Browse printables
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="pill-label w-fit text-[var(--brand-sky)]">Your cart</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Ready when you are.
        </h1>
        <div className="mt-6 space-y-4">
          {detailedItems.map(({ item, product, variant, lineTotal }) => (
            <article
              key={`${product.slug}-${variant.id}`}
              className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-[0_12px_30px_rgba(32,48,66,0.08)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-coral)]">
                    {product.category}
                  </p>
                  <h2 className="section-title mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {variant.name} • {variant.pageCount} printable pages
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-black text-[var(--brand-ink)]">
                    {formatPrice(lineTotal)}
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatPrice(variant.price)} each
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  <button
                    type="button"
                    className="px-4 py-2 font-black text-[var(--brand-ink)]"
                    onClick={() => setQuantity(product.slug, variant.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-black text-[var(--brand-ink)]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2 font-black text-[var(--brand-ink)]"
                    onClick={() => setQuantity(product.slug, variant.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4"
                  onClick={() => removeItem(product.slug, variant.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="card-surface rounded-[2rem] px-5 py-6 sm:px-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
          Order summary
        </p>
        <div className="mt-5 flex items-center justify-between text-lg font-bold text-slate-700">
          <span>Items</span>
          <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-3xl font-black text-[var(--brand-ink)]">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Checkout runs through secure Stripe payment, and your downloads will be
          available on the success page right after purchase.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="primary-button w-full"
            disabled={isPending}
            onClick={handleCheckout}
          >
            {isPending ? "Opening Stripe checkout..." : "Checkout"}
          </button>
          <Link href="/#shop" className="secondary-button w-full">
            Keep browsing
          </Link>
        </div>
        {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
      </aside>
    </div>
  );
}
