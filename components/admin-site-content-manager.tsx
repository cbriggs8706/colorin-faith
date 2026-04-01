"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImageUrl } from "@/lib/product-assets";
import type { SiteContent } from "@/lib/types";

function cloneSiteContent(siteContent: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(siteContent)) as SiteContent;
}

function createEmptyFaq(): SiteContent["faqs"][number] {
  return {
    question: "",
    answer: "",
  };
}

export function AdminSiteContentManager({
  title,
  description,
  initialSiteContent,
  sections,
}: {
  title: string;
  description: string;
  initialSiteContent: SiteContent;
  sections: Array<"homepage" | "productPage" | "contactPage" | "faqs">;
}) {
  const [siteContent, setSiteContent] = useState(() => cloneSiteContent(initialSiteContent));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  function setValueProp(
    index: number,
    field: keyof SiteContent["valueProps"][number],
    value: string,
  ) {
    setSiteContent((current) => ({
      ...current,
      valueProps: current.valueProps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function setStep(index: number, field: keyof SiteContent["steps"][number], value: string) {
    setSiteContent((current) => ({
      ...current,
      steps: current.steps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function setFaq(index: number, field: keyof SiteContent["faqs"][number], value: string) {
    setSiteContent((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addFaq() {
    setSiteContent((current) => ({
      ...current,
      faqs: [...current.faqs, createEmptyFaq()],
    }));
  }

  function removeFaq(index: number) {
    setSiteContent((current) => ({
      ...current,
      faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveSiteContent() {
    setIsPending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(siteContent),
      });

      const payload = (await response.json()) as SiteContent & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save site copy.");
      }

      setSiteContent(cloneSiteContent(payload));
      setStatus("Site copy saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save site copy.");
    } finally {
      setIsPending(false);
    }
  }

  const includesHomepage = sections.includes("homepage");
  const includesProductPage = sections.includes("productPage");
  const includesContactPage = sections.includes("contactPage");
  const includesFaqs = sections.includes("faqs");
  const profileImageUrl = siteContent.contactPage.profileImagePath
    ? getProductImageUrl(siteContent.contactPage.profileImagePath)
    : "";

  async function uploadContactProfileImage(file: File) {
    setIsUploadingImage(true);
    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("alt", siteContent.contactPage.profileImageAlt);

      const response = await fetch("/api/admin/site-content/contact-profile", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as SiteContent & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload profile image.");
      }

      setSiteContent(cloneSiteContent(payload));
      setStatus("Profile image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload profile image.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function removeContactProfileImage() {
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/site-content/contact-profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: siteContent.contactPage.profileImagePath }),
      });
      const payload = (await response.json()) as SiteContent & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to remove profile image.");
      }

      setSiteContent(cloneSiteContent(payload));
      setStatus("Profile image removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove profile image.");
    }
  }

  return (
    <section className="card-surface rounded-[2rem] px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-sky)]">
            Site copy
          </p>
          <h2 className="mt-2 text-2xl font-black text-[var(--brand-ink)]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <button
          className="primary-button"
          disabled={isPending}
          onClick={saveSiteContent}
          type="button"
        >
          {isPending ? "Saving copy..." : "Save copy"}
        </button>
      </div>

      <div className="mt-6 grid gap-6">
        {includesHomepage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <h3 className="text-lg font-black text-[var(--brand-ink)]">Homepage intro</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Eyebrow
              <input
                className="field"
                value={siteContent.homepage.shop.eyebrow}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      shop: {
                        ...current.homepage.shop,
                        eyebrow: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Empty state
              <input
                className="field"
                value={siteContent.homepage.shop.emptyState}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      shop: {
                        ...current.homepage.shop,
                        emptyState: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Title
              <input
                className="field"
                value={siteContent.homepage.shop.title}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      shop: {
                        ...current.homepage.shop,
                        title: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Description
              <textarea
                className="field min-h-28"
                value={siteContent.homepage.shop.description}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      shop: {
                        ...current.homepage.shop,
                        description: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
          </div>
          </section>
        ) : null}

        {includesHomepage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <h3 className="text-lg font-black text-[var(--brand-ink)]">Homepage value cards</h3>
          <div className="mt-4 grid gap-4">
            {siteContent.valueProps.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Card {index + 1}
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Icon
                    <input
                      className="field"
                      value={item.icon}
                      onChange={(event) => setValueProp(index, "icon", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Accent color
                    <input
                      className="field"
                      value={item.accent}
                      onChange={(event) => setValueProp(index, "accent", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                    Title
                    <input
                      className="field"
                      value={item.title}
                      onChange={(event) => setValueProp(index, "title", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                    Description
                    <textarea
                      className="field min-h-24"
                      value={item.description}
                      onChange={(event) => setValueProp(index, "description", event.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
          </section>
        ) : null}

        {includesHomepage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <h3 className="text-lg font-black text-[var(--brand-ink)]">How It Works</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Eyebrow
              <input
                className="field"
                value={siteContent.homepage.howItWorks.eyebrow}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      howItWorks: {
                        ...current.homepage.howItWorks,
                        eyebrow: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Title
              <input
                className="field"
                value={siteContent.homepage.howItWorks.title}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      howItWorks: {
                        ...current.homepage.howItWorks,
                        title: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4">
            {siteContent.steps.map((step, index) => (
              <article key={`${step.title}-${index}`} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Step {index + 1}
                </p>
                <div className="mt-3 grid gap-4">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Title
                    <input
                      className="field"
                      value={step.title}
                      onChange={(event) => setStep(index, "title", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Description
                    <textarea
                      className="field min-h-24"
                      value={step.description}
                      onChange={(event) => setStep(index, "description", event.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
          </section>
        ) : null}

        {includesHomepage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <h3 className="text-lg font-black text-[var(--brand-ink)]">Homepage newsletter card</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Eyebrow
              <input
                className="field"
                value={siteContent.homepage.newsletter.eyebrow}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      newsletter: {
                        ...current.homepage.newsletter,
                        eyebrow: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Form heading
              <input
                className="field"
                value={siteContent.homepage.newsletter.formHeading}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      newsletter: {
                        ...current.homepage.newsletter,
                        formHeading: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Title
              <input
                className="field"
                value={siteContent.homepage.newsletter.title}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      newsletter: {
                        ...current.homepage.newsletter,
                        title: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Card description
              <textarea
                className="field min-h-24"
                value={siteContent.homepage.newsletter.description}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      newsletter: {
                        ...current.homepage.newsletter,
                        description: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Form subheading
              <textarea
                className="field min-h-24"
                value={siteContent.homepage.newsletter.formSubheading}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    homepage: {
                      ...current.homepage,
                      newsletter: {
                        ...current.homepage.newsletter,
                        formSubheading: event.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
          </div>
          </section>
        ) : null}

        {includesProductPage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <h3 className="text-lg font-black text-[var(--brand-ink)]">Product pages</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              About eyebrow
              <input
                className="field"
                value={siteContent.productPage.aboutPrintableEyebrow}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      aboutPrintableEyebrow: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Perfect for eyebrow
              <input
                className="field"
                value={siteContent.productPage.perfectForEyebrow}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      perfectForEyebrow: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              After purchase title
              <input
                className="field"
                value={siteContent.productPage.afterPurchaseTitle}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      afterPurchaseTitle: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Browse button label
              <input
                className="field"
                value={siteContent.productPage.browseMoreLabel}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      browseMoreLabel: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              After purchase description
              <textarea
                className="field min-h-24"
                value={siteContent.productPage.afterPurchaseDescription}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      afterPurchaseDescription: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Newsletter heading
              <input
                className="field"
                value={siteContent.productPage.newsletterHeading}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      newsletterHeading: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Newsletter subheading
              <textarea
                className="field min-h-24"
                value={siteContent.productPage.newsletterSubheading}
                onChange={(event) =>
                  setSiteContent((current) => ({
                    ...current,
                    productPage: {
                      ...current.productPage,
                      newsletterSubheading: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>
          </section>
        ) : null}

        {includesContactPage ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
            <h3 className="text-lg font-black text-[var(--brand-ink)]">Contact page profile</h3>
            <div className="mt-4 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  {profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt={siteContent.contactPage.profileImageAlt || siteContent.contactPage.profileTitle}
                      width={800}
                      height={800}
                      className="h-80 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-80 items-center justify-center bg-[var(--surface-pop)] px-6 text-center text-sm font-bold text-slate-500">
                      Upload a portrait or brand photo for the contact page.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="secondary-button cursor-pointer px-4 py-2 text-sm">
                    {isUploadingImage ? "Uploading..." : "Upload image"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
                      disabled={isUploadingImage}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          void uploadContactProfileImage(file);
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>
                  {siteContent.contactPage.profileImagePath ? (
                    <button
                      className="secondary-button px-4 py-2 text-sm"
                      type="button"
                      onClick={() => void removeContactProfileImage()}
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Eyebrow
                  <input
                    className="field"
                    value={siteContent.contactPage.profileEyebrow}
                    onChange={(event) =>
                      setSiteContent((current) => ({
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          profileEyebrow: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Image alt text
                  <input
                    className="field"
                    value={siteContent.contactPage.profileImageAlt}
                    onChange={(event) =>
                      setSiteContent((current) => ({
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          profileImageAlt: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                  Title
                  <input
                    className="field"
                    value={siteContent.contactPage.profileTitle}
                    onChange={(event) =>
                      setSiteContent((current) => ({
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          profileTitle: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                  Description
                  <textarea
                    className="field min-h-32"
                    value={siteContent.contactPage.profileDescription}
                    onChange={(event) =>
                      setSiteContent((current) => ({
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          profileDescription: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </section>
        ) : null}

        {includesFaqs ? (
          <section className="rounded-[1.5rem] bg-white/70 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-[var(--brand-ink)]">FAQs</h3>
            <button
              className="secondary-button px-4 py-2 text-sm"
              onClick={addFaq}
              type="button"
            >
              Add FAQ
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            {siteContent.faqs.map((faq, index) => (
              <article key={`${faq.question}-${index}`} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    FAQ {index + 1}
                  </p>
                  <button
                    className="secondary-button px-3 py-1.5 text-xs"
                    onClick={() => removeFaq(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-4">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Question
                    <input
                      className="field"
                      value={faq.question}
                      onChange={(event) => setFaq(index, "question", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Answer
                    <textarea
                      className="field min-h-24"
                      value={faq.answer}
                      onChange={(event) => setFaq(index, "answer", event.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
          </section>
        ) : null}
      </div>

      {(status || error) && (
        <div className="mt-6 space-y-2">
          {status ? <p className="text-sm font-bold text-emerald-700">{status}</p> : null}
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
