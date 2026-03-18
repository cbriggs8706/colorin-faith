"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push("/admin");
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Unable to sign in.",
        );
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Admin email
        <input
          className="field"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Password
        <input
          className="field"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button className="primary-button w-full sm:w-fit" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in to admin"}
      </button>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </form>
  );
}
