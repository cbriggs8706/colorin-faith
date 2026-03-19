"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";

type AddToCartButtonProps = {
  slug: string;
  variantId: string;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  slug,
  variantId,
  className = "secondary-button",
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem(slug, variantId, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {justAdded ? "Added" : label}
    </button>
  );
}
