"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/app/settings", label: "Account" },
  { href: "/app/settings/security", label: "Security" },
  { href: "/app/settings/data", label: "Your data" },
] as const;

export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Settings" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200 [scrollbar-width:none]">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm transition-colors duration-150 ${
              active ? "border-slate-800 font-medium text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
