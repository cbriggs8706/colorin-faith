"use client";

import { signIn } from "next-auth/react";

type Props = {
  callbackUrl: string;
  label?: string;
};

export function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
}: Props) {
  return (
    <button
      type="button"
      className="secondary-button w-full"
      onClick={() => void signIn("google", { callbackUrl })}
    >
      {label}
    </button>
  );
}
