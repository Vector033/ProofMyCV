import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "./actions";

const nav = [
  { href: "/app", label: "Applications" },
  { href: "/app/facts", label: "Fact bank" },
  { href: "/app/settings", label: "Settings" },
] as const;

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/app" className="font-semibold tracking-tight">
            Fact<span className="text-emerald-700">Fit</span>
          </Link>
          <nav className="flex gap-4 text-sm text-stone-600">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-stone-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-stone-500">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <button className="btn">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
