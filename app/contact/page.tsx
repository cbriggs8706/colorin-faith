export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Contact</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Need help with an order, licensing, or custom bundle idea?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Replace the placeholder email below with your support inbox when you are
          ready to launch.
        </p>
      </section>

      <section className="card-surface rounded-[1.75rem] px-5 py-6 sm:px-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-white/75 px-4 py-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Email
            </p>
            <a
              className="mt-2 inline-flex text-lg font-black text-[var(--brand-ink)]"
              href="mailto:hello@colorinfaithprintables.com"
            >
              hello@colorinfaithprintables.com
            </a>
          </div>
          <div className="rounded-[1.5rem] bg-white/75 px-4 py-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              Response rhythm
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Tell customers when you usually reply, such as within 1 to 2 business
              days.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
