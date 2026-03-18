import Link from "next/link";

export const metadata = {
  title: "Order Success",
};

export default function SuccessPage() {
  return (
    <div className="flex flex-1 items-center py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(32,48,66,0.14)]">
        <p className="pill-label mx-auto w-fit text-[var(--brand-mint)]">Payment complete</p>
        <h1 className="section-title mt-4 text-4xl font-extrabold text-[var(--brand-ink)]">
          Thank you for your order.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Stripe checkout completed successfully. Use this page as the handoff point
          for delivery instructions, download links, or account-based file access.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="primary-button" href="/shop">
            Continue shopping
          </Link>
          <Link className="secondary-button" href="/admin">
            Open admin
          </Link>
        </div>
      </section>
    </div>
  );
}
