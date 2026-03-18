"use client";

import { useState } from "react";

type NewsletterFormProps = {
  heading: string;
  subheading: string;
};

export function NewsletterForm({
  heading,
  subheading,
}: NewsletterFormProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, email }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save subscriber.");
      }

      setMessage(payload.message ?? "Thanks for joining the list.");
      setFirstName("");
      setEmail("");
    } catch (newsletterError) {
      setError(
        newsletterError instanceof Error
          ? newsletterError.message
          : "Unable to save subscriber.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="section-title text-3xl font-extrabold text-[var(--brand-ink)]">
          {heading}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">{subheading}</p>
      </div>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <input
          className="field"
          placeholder="First name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <input
          className="field"
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className="primary-button w-full sm:w-fit" disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Join the list"}
        </button>
        {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
