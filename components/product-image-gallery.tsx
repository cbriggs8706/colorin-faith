"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProductImageGalleryProps = {
  images: Array<{
    src: string;
    alt: string;
  }>;
};

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? current : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? current : (current - 1 + images.length) % images.length,
        );
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <div className="space-y-3">
        <button
          className="group relative block w-full overflow-hidden rounded-[2rem]"
          onClick={() => setActiveIndex(0)}
          type="button"
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              alt={images[0].alt}
              className="object-cover transition duration-200 group-hover:scale-[1.02]"
              fill
              loading="eager"
              src={images[0].src}
              unoptimized
            />
          </div>
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/88 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-ink)] sm:left-auto">
            Click to enlarge
          </span>
        </button>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              className="group relative overflow-hidden rounded-[1.25rem]"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt={image.alt}
                className="h-28 w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                height={224}
                src={image.src}
                unoptimized
                width={224}
              />
            </button>
          ))}
        </div>
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,24,35,0.82)] p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[var(--brand-ink)]"
            onClick={() => setActiveIndex(null)}
            type="button"
          >
            Close
          </button>
          {images.length > 1 ? (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-3 text-sm font-black text-[var(--brand-ink)]"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) =>
                  current === null ? current : (current - 1 + images.length) % images.length,
                );
              }}
              type="button"
            >
              Prev
            </button>
          ) : null}
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-slate-100">
              <Image
                alt={activeImage.alt}
                className="object-contain"
                fill
                src={activeImage.src}
                unoptimized
              />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-600">{activeImage.alt}</p>
          </div>
          {images.length > 1 ? (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-3 text-sm font-black text-[var(--brand-ink)]"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) =>
                  current === null ? current : (current + 1) % images.length,
                );
              }}
              type="button"
            >
              Next
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
