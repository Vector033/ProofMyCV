"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app", label: "Applications" },
  { href: "/app/facts", label: "Fact bank" },
  { href: "/app/settings", label: "Settings" },
] as const;

export function AppNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" || path.startsWith("/app/applications") : path.startsWith(href));
  return (
    <nav aria-label="Main" className="order-last flex w-full gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] text-sm sm:order-none sm:w-auto">
      {nav.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={active(n.href) ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-2.5 transition-colors duration-150 ${
            active(n.href) ? "border-emerald-700 font-medium text-stone-900" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
