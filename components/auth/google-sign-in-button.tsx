"use client";

import { signIn } from "next-auth/react";

type Props = {
  callbackUrl: string;
  label?: string;
  className?: string;
};

export function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
  className = "secondary-button w-full",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => void signIn("google", { callbackUrl })}
    >
      {label}
    </button>
  );
}
