"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFile, IconLayers, IconUser } from "@/components/icons";

type NavItem = { href: string; label: string; icon: typeof IconFile };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { href: "/app", label: "Applications", icon: IconFile },
      { href: "/app/facts", label: "Fact bank", icon: IconLayers },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/app/settings", label: "Settings", icon: IconUser }],
  },
]

function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app" || path.startsWith("/app/applications");
  return path.startsWith(href);
}

/** Sidebar navigation on large screens. */
export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(path, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
                      active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={active ? "text-slate-900" : "text-slate-400"} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The same links as a scrollable row under the top bar on small screens. */
export function TopNav() {
  const path = usePathname();
  const items = groups.flatMap((g) => g.items);
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none]">
      {items.map(({ href, label }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-2.5 text-sm transition-colors duration-150 ${
              active ? "border-slate-800 font-medium text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
