"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin", label: "Overview", match: (pathname: string) => pathname === "/admin" },
  {
    href: "/admin/products",
    label: "Products",
    match: (pathname: string) => pathname.startsWith("/admin/products"),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    match: (pathname: string) => pathname.startsWith("/admin/orders"),
  },
  {
    href: "/admin/content/homepage",
    label: "Homepage wording",
    match: (pathname: string) => pathname.startsWith("/admin/content/homepage"),
  },
  {
    href: "/admin/content/product-page",
    label: "Product page wording",
    match: (pathname: string) => pathname.startsWith("/admin/content/product-page"),
  },
  {
    href: "/admin/content/faqs",
    label: "FAQs",
    match: (pathname: string) => pathname.startsWith("/admin/content/faqs"),
  },
  {
    href: "/admin/content/contact",
    label: "Contact page profile",
    match: (pathname: string) => pathname.startsWith("/admin/content/contact"),
  },
  {
    href: "/admin/custom-order",
    label: "Custom order",
    match: (pathname: string) => pathname.startsWith("/admin/custom-order"),
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="card-surface rounded-[2rem] px-3 py-3">
      <p className="px-3 pb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Navigation
      </p>
      <ul className="space-y-2">
        {sections.map((section) => {
          const active = section.match(pathname);

          return (
            <li key={section.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between rounded-[1.25rem] border px-4 py-3 text-sm font-black transition-colors ${
                  active
                    ? "border-[rgba(31,152,238,0.28)] bg-[rgba(31,152,238,0.14)] text-[var(--brand-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]"
                    : "border-slate-200 bg-[rgba(248,250,252,0.92)] text-slate-700 hover:bg-white hover:text-[var(--brand-ink)]"
                }`}
                href={section.href}
              >
                <span>{section.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    active ? "bg-[var(--brand-sky)]" : "bg-slate-300"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
