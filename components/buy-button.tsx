"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

export function BuyButton({ product }: { product: Product }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: product.slug }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

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

  return (
    <div className="space-y-3">
      <button className="primary-button w-full" onClick={handleCheckout} disabled={isPending}>
        {isPending ? "Opening Stripe checkout..." : "Buy now with Stripe"}
      </button>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
