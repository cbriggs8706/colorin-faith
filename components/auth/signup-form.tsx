"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createUserAccountAction } from "@/app/signup/actions";

const initialState = {
  error: undefined,
  success: undefined,
};

type Props = {
  email?: string;
  callbackUrl: string;
};

export function SignupForm({ email, callbackUrl }: Props) {
  const [state, formAction, isPending] = useActionState(
    createUserAccountAction,
    initialState,
  );

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-bold text-slate-700">
          Full name
        </label>
        <input
          id="name"
          name="name"
          className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-bold text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={email}
          className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-bold text-slate-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-bold text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-sky)]"
          required
        />
      </div>

      {state.error ? <p className="text-sm font-bold text-red-600">{state.error}</p> : null}

      {state.success ? (
        <p className="text-sm font-bold text-emerald-700">
          {state.success}{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline"
          >
            Sign in
          </Link>
        </p>
      ) : null}

      <button type="submit" className="primary-button w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
