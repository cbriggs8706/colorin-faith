"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductReviewImageAccept } from "@/lib/product-review-assets";
import type { ProductReviewType, ProductReviewWithUrls } from "@/lib/types";

type OrderReviewFormProps = {
  reviewType: ProductReviewType;
  orderId: string;
  productName: string;
  initialReview: ProductReviewWithUrls | null;
  uploadsEnabled: boolean;
};

function getStatusLabel(status: ProductReviewWithUrls["review"]["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderReviewForm({
  reviewType,
  orderId,
  productName,
  initialReview,
  uploadsEnabled,
}: OrderReviewFormProps) {
  const [rating, setRating] = useState(initialReview?.review.rating ?? 5);
  const [title, setTitle] = useState(initialReview?.review.title ?? "");
  const [review, setReview] = useState(initialReview?.review.review ?? "");
  const [savedReview, setSavedReview] = useState<ProductReviewWithUrls | null>(initialReview);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("reviewType", reviewType);
      formData.set("orderId", orderId);
      formData.set("rating", String(rating));
      formData.set("title", title);
      formData.set("review", review);

      for (const file of selectedFiles) {
        formData.append("photos", file);
      }

      const response = await fetch("/api/product-reviews", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | ProductReviewWithUrls
        | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error ?? "Unable to save review." : "Unable to save review.");
      }

      if (!("review" in payload)) {
        throw new Error("Unable to save review.");
      }

      setSavedReview(payload);
      setSelectedFiles([]);
      setMessage(
        payload.review.status === "approved"
          ? "Your review has been updated."
          : "Thanks! Your review has been submitted for approval.",
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save review.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="mt-5 rounded-[1.35rem] bg-[var(--surface-pop)] px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[var(--brand-ink)]">
            Share how {productName} turned out
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Leave a quick review and upload photos of your finished product.
          </p>
        </div>
        {savedReview ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
            {getStatusLabel(savedReview.review.status)}
          </span>
        ) : null}
      </div>

      {!uploadsEnabled ? (
        <p className="mt-4 text-sm font-bold text-slate-600">
          Review uploads are not configured for this environment yet.
        </p>
      ) : (
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Rating</span>
            <select
              className="field"
              onChange={(event) => setRating(Number(event.target.value))}
              value={rating}
            >
              <option value={5}>5 stars</option>
              <option value={4}>4 stars</option>
              <option value={3}>3 stars</option>
              <option value={2}>2 stars</option>
              <option value={1}>1 star</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Headline</span>
            <input
              className="field"
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
              value={title}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Review</span>
            <textarea
              className="field min-h-32"
              maxLength={1500}
              onChange={(event) => setReview(event.target.value)}
              placeholder="What did you enjoy, and how did you use it?"
              required
              value={review}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Finished-product photos</span>
            <input
              accept={getProductReviewImageAccept()}
              className="field"
              multiple
              onChange={(event) =>
                setSelectedFiles(Array.from(event.target.files ?? []))
              }
              type="file"
            />
            <p className="text-xs font-medium text-slate-500">
              Upload up to 5 images. Leave this empty to keep your existing photos.
            </p>
          </label>

          {selectedFiles.length > 0 ? (
            <p className="text-sm font-bold text-slate-600">
              {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
            </p>
          ) : null}

          {savedReview?.photoUrls.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedReview.photoUrls.map((photo) => (
                <Image
                  key={photo.path}
                  alt={`Customer review for ${productName}`}
                  className="aspect-square rounded-[1.1rem] object-cover shadow-[0_10px_24px_rgba(32,48,66,0.12)]"
                  src={photo.signedUrl}
                  unoptimized
                  width={420}
                  height={420}
                />
              ))}
            </div>
          ) : null}

          <button className="primary-button w-full sm:w-fit" disabled={isPending} type="submit">
            {isPending ? "Saving..." : savedReview ? "Update review" : "Submit review"}
          </button>

          {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
        </form>
      )}
    </section>
  );
}
