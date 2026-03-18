import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "FAQ",
};

export default async function FaqPage() {
  const siteContent = await getSiteContent();

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-berry)]">FAQ</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Helpful answers for digital printable customers.
        </h1>
      </section>

      <section className="space-y-4">
        {siteContent.faqs.map((faq) => (
          <article key={faq.question} className="card-surface rounded-[1.75rem] px-5 py-5">
            <h2 className="text-lg font-black text-[var(--brand-ink)]">{faq.question}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
