"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

type BuyButtonProps = {
  product: Product;
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
};

export function BuyButton({
  product,
  selectedVariantId: controlledVariantId,
  onVariantChange,
}: BuyButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [uncontrolledVariantId, setUncontrolledVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const { addItem } = useCart();
  const selectedVariantId = controlledVariantId ?? uncontrolledVariantId;
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];

  function setSelectedVariantId(variantId: string) {
    onVariantChange?.(variantId);

    if (controlledVariantId === undefined) {
      setUncontrolledVariantId(variantId);
    }
  }

  async function handleCheckout() {
    if (!selectedVariant) {
      setError("Choose a variant before checkout.");
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
          items: [{ slug: product.slug, variantId: selectedVariant.id, quantity: 1 }],
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.",
      );
      setIsPending(false);
    }
  }

  function handleAddToCart() {
    if (!selectedVariant) {
      setError("Choose a variant before adding it to the cart.");
      return;
    }

    addItem(product.slug, selectedVariant.id, 1);
    setAddedToCart(true);
    setError("");
    window.setTimeout(() => setAddedToCart(false), 1600);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {product.variants.map((variant) => {
          const isSelected = variant.id === selectedVariant?.id;

          return (
            <button
              key={variant.id}
              type="button"
              className={`rounded-[1.2rem] border px-4 py-3 text-left ${
                isSelected
                  ? "border-[var(--brand-ink)] bg-white"
                  : "border-white/80 bg-white/70"
              }`}
              onClick={() => setSelectedVariantId(variant.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-[var(--brand-ink)]">{variant.name}</p>
                  <p className="text-sm text-slate-600">{variant.pageCount} pages</p>
                </div>
                <p className="text-lg font-black text-[var(--brand-ink)]">
                  ${variant.price.toFixed(2)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="secondary-button flex-1"
          onClick={handleAddToCart}
          disabled={isPending}
        >
          {addedToCart ? "Added to cart" : "Add to cart"}
        </button>
        <button
          type="button"
          className="primary-button flex-1"
          onClick={handleCheckout}
          disabled={isPending}
        >
          {isPending ? "Opening Stripe checkout..." : "Buy now"}
        </button>
      </div>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
