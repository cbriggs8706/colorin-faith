import { ContactForm } from "@/components/contact-form";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Contact</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Need help with an order, licensing question, or bundle request?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Send a message here and it will go straight to the shop inbox.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card-surface rounded-[1.75rem] px-5 py-6 sm:px-7">
          <ContactForm />
        </div>

        <div className="card-surface rounded-[1.75rem] px-5 py-6 sm:px-7">
          <div className="rounded-[1.5rem] bg-white/75 px-4 py-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Response rhythm
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Messages are typically answered within 1 to 2 business days.
            </p>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-white/75 px-4 py-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Best for
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Order help, download access, classroom or ministry licensing, and custom bundle questions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
