import Link from "next/link";

export const metadata = {
  title: "Checkout Canceled",
};

export default function CancelPage() {
  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label mx-auto w-fit text-[var(--brand-coral)]">Checkout canceled</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Your printable pack is still waiting.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          No worries if someone backed out of checkout. Bring them back to the shop
          or product page and let them try again when ready.
        </p>
        <div className="mt-6 flex justify-center">
          <Link className="primary-button" href="/#shop">
            Return to printables
          </Link>
        </div>
      </section>
    </div>
  );
}
