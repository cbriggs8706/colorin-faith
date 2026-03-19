"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

const storageKey = "colorin-faith-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (slug: string, variantId: string, quantity?: number) => void;
  setQuantity: (slug: string, variantId: string, quantity: number) => void;
  removeItem: (slug: string, variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeItems(items: CartItem[]) {
  return items
    .filter((item) => item.slug && item.variantId && item.quantity > 0)
    .map((item) => ({
      slug: item.slug,
      variantId: item.variantId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (raw) {
        setItems(normalizeItems(JSON.parse(raw) as CartItem[]));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hasLoaded, items]);

  const value = useMemo<CartContextValue>(() => {
    function addItem(slug: string, variantId: string, quantity = 1) {
      setItems((current) => {
        const existing = current.find(
          (item) => item.slug === slug && item.variantId === variantId,
        );

        if (!existing) {
          return [
            ...current,
            { slug, variantId, quantity: Math.max(1, Math.floor(quantity)) },
          ];
        }

        return current.map((item) =>
          item.slug === slug && item.variantId === variantId
            ? {
                ...item,
                quantity: item.quantity + Math.max(1, Math.floor(quantity)),
              }
            : item,
        );
      });
    }

    function setQuantity(slug: string, variantId: string, quantity: number) {
      const nextQuantity = Math.max(0, Math.floor(quantity));

      setItems((current) =>
        nextQuantity === 0
          ? current.filter((item) => !(item.slug === slug && item.variantId === variantId))
          : current.map((item) =>
              item.slug === slug && item.variantId === variantId
                ? { ...item, quantity: nextQuantity }
                : item,
            ),
      );
    }

    function removeItem(slug: string, variantId: string) {
      setItems((current) =>
        current.filter((item) => !(item.slug === slug && item.variantId === variantId)),
      );
    }

    function clearCart() {
      setItems([]);
    }

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return value;
}
