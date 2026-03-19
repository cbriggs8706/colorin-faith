import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "FAQ",
};

const aboutHighlights = [
  {
    title: "Faith-centered",
    text: "Products connect creativity with Scripture, Bible stories, and kind encouragement.",
  },
  {
    title: "Easy to print",
    text: "Every set is digital-first and designed for at-home or classroom printing.",
  },
  {
    title: "Made for real life",
    text: "Use them in quiet time baskets, church bags, lessons, parties, and rainy afternoons.",
  },
];

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

      <section id="about" className="flex flex-col gap-5">
        <div className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
          <p className="pill-label w-fit text-[var(--brand-coral)]">About Color in Faith</p>
          <h2 className="section-title mt-3 text-3xl font-extrabold text-[var(--brand-ink)] sm:text-4xl">
            Color in Faith Printables helps families make faith feel joyful and hands-on.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            This brand is designed for parents, grandparents, homeschool families,
            ministry leaders, and teachers who want bright printable resources that
            are easy to use and full of encouragement. The visual style is playful,
            cheerful, and welcoming so kids feel excited to engage.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {aboutHighlights.map((item) => (
            <article key={item.title} className="card-surface rounded-[1.75rem] px-5 py-5">
              <h3 className="text-xl font-black text-[var(--brand-ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
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
