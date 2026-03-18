"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send message.");
      }

      setStatus(payload.message ?? "Your message has been sent.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to send message.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Name
        <input
          className="field"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Email
        <input
          className="field"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Message
        <textarea
          className="field min-h-36"
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <button className="primary-button w-full sm:w-fit" disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send message"}
      </button>
      {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </form>
  );
}
