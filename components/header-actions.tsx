"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useCart } from "@/components/cart-provider";
import { AccountIcon, CartIcon } from "@/components/site-icons";

export function HeaderActions({ isSignedIn }: { isSignedIn: boolean }) {
  const { itemCount } = useCart();

  return (
    <>
      <Link
        href="/cart"
        aria-label={itemCount > 0 ? `Cart with ${itemCount} items` : "Cart"}
        className="relative rounded-full p-2 transition hover:bg-[var(--surface-pop)]"
      >
        <CartIcon />
        {itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-coral)] px-1 text-[11px] font-black text-white">
            {itemCount}
          </span>
        ) : null}
      </Link>
      {isSignedIn ? (
        <>
          <Link
            href="/orders"
            className="rounded-full px-4 py-2 transition hover:bg-[var(--surface-pop)]"
          >
            My Orders
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/login?callbackUrl=%2Forders"
          aria-label="Sign in"
          className="rounded-full p-2 transition hover:bg-[var(--surface-pop)]"
        >
          <AccountIcon />
        </Link>
      )}
    </>
  );
}
