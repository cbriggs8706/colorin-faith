import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="gradient-cool-panel mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.75rem] border border-white/70 px-5 py-5 text-sm text-slate-600 shadow-[0_18px_40px_rgba(32,48,66,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-[var(--brand-ink)]">
            Color in Faith Printables
          </p>
          <p className="mt-1">
            Visit us at{" "}
            <span className="font-bold text-slate-700">
              colorinfaithprintables.com
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/shop">Shop</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
