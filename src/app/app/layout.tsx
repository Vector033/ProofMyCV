import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { IconLogout } from "@/components/icons";
import { signOutAction } from "./actions";
import { SideNav, TopNav } from "./nav";

function Logo() {
  return (
    <Link href="/app" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight text-slate-900">
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-slate-800 text-[13px] font-bold text-white">
        F
      </span>
      <span>
        Fact<span className="text-emerald-700">Fit</span>
      </span>
    </Link>
  );
}

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const initial = (user.email[0] ?? "?").toUpperCase();
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <Logo />
        </div>
        <SideNav />
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user.email}</p>
              <Link href="/app/settings" className="text-xs text-slate-500 hover:text-slate-800">
                Account settings
              </Link>
            </div>
            <form action={signOutAction}>
              <button className="btn-ghost size-9 text-slate-500" aria-label="Sign out">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <form action={signOutAction}>
              <button className="btn btn-sm">Sign out</button>
            </form>
          </div>
          <TopNav />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
