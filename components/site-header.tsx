import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[1.75rem] border border-white/75 bg-white/78 px-4 py-4 shadow-[0_18px_40px_rgba(32,48,66,0.1)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="gradient-panel flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] shadow-[0_10px_30px_rgba(31,80,181,0.25)]">
            <Image
              src="/apple-touch-icon.png"
              alt="Color in Faith logo"
              width={42}
              height={42}
              className="h-10 w-10 rounded-[0.95rem]"
              priority
            />
          </div>
          <div>
            <p className="section-title text-2xl font-extrabold text-[var(--brand-ink)]">
              Color in Faith
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Printables
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition hover:bg-[var(--surface-pop)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
