"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

type Props = {
  callbackUrl: string;
  allowGoogle: boolean;
};

export function LoginForm({ callbackUrl, allowGoogle }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCredentialsSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        username,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.ok && result.url) {
        window.location.href = result.url;
        return;
      }

      setError("Sign in failed. Check your username/email and password.");
    });
  }

  return (
    <div className="space-y-5">
      {allowGoogle ? (
        <button
          type="button"
          className="secondary-button w-full"
          onClick={() => void signIn("google", { callbackUrl })}
        >
          Continue with Google
        </button>
      ) : null}

      {allowGoogle ? (
        <div className="text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
          or use your account
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleCredentialsSignIn}>
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-bold text-slate-700">
            Username or email
          </label>
          <input
            id="username"
            className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold text-slate-700">
            Password
          </label>
          <input
            id="password"
            className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

        <button type="submit" className="primary-button w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-[var(--brand-ink)] underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
