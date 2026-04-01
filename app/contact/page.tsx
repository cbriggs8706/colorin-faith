import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { getProductImageUrl } from "@/lib/product-assets";
import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const siteContent = await getSiteContent();
  const profileImageUrl = siteContent.contactPage.profileImagePath
    ? getProductImageUrl(siteContent.contactPage.profileImagePath)
    : "";

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Contact</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Need help with an order or question?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Send a message here and it will go straight to Cameron.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card-surface rounded-[1.75rem] px-5 py-6 sm:px-7">
          <ContactForm />
        </div>

        <div className="card-surface rounded-[1.75rem] px-5 py-6 sm:px-7">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={siteContent.contactPage.profileImageAlt || siteContent.contactPage.profileTitle}
              width={900}
              height={1100}
              className="h-72 w-full rounded-[1.5rem] object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-[1.5rem] bg-[var(--surface-pop)] px-6 text-center text-sm font-bold text-slate-500">
              Add a profile image from the admin contact page to personalize this section.
            </div>
          )}

          <div className="mt-5 rounded-[1.5rem] bg-white/75 px-4 py-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-berry)]">
              {siteContent.contactPage.profileEyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-black text-[var(--brand-ink)]">
              {siteContent.contactPage.profileTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {siteContent.contactPage.profileDescription}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
