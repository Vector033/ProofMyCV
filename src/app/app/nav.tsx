"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFile, IconLayers, IconUser } from "@/components/icons";

const items = [
  { href: "/app", label: "Applications", icon: IconFile },
  { href: "/app/facts", label: "Fact bank", icon: IconLayers },
  { href: "/app/settings", label: "Settings", icon: IconUser },
];

function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app" || path.startsWith("/app/applications");
  return path.startsWith(href);
}

/** The three app sections, centred in the sticky #2 Fluted Glass top bar (scrollable on phones). */
export function AppNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
      {/* Outer pill rail: md:rounded-xl (12px) + md:p-1 (4px) -> inner links rounded-lg (8px) [12 - 4 = 8] */}
      <ul className="fluted-glass flex gap-1 md:rounded-xl md:border md:border-slate-200/80 md:p-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`press flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150 ${
                  active
                    ? "bg-white font-medium text-slate-900 shadow-xs ring-1 ring-slate-200/90 md:ring-0"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={active ? "text-slate-900" : "text-slate-500"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
