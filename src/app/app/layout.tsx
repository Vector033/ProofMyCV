import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { IconLogout } from "@/components/icons";
import { signOutAction } from "./actions";
import { AppNav } from "./nav";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const initial = (user.email[0] ?? "?").toUpperCase();
  return (
    <div className="flex flex-1 flex-col">
      {/* One top bar: logo left, the three sections centred, account right. On phones the
          sections drop to their own row and the bar scrolls away to save height. */}
      <header className="fluted-glass z-20 border-b border-slate-200/80 md:sticky md:top-0">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <Link href="/app" className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-md font-semibold tracking-tight text-slate-900">
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-slate-800 text-[13px] font-bold text-white">
              F
            </span>
            <span>
              Fact<span className="text-emerald-700">Fit</span>
            </span>
          </Link>

          <div className="hidden md:block">
            <AppNav />
          </div>

          <div className="flex items-center gap-1 justify-self-end">
            <Link
              href="/app/settings"
              aria-label={`Account settings for ${user.email}`}
              title={user.email}
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-slate-100"
            >
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-800">
                {initial}
              </span>
              <span className="hidden max-w-[14rem] truncate text-sm text-slate-700 lg:inline">{user.email}</span>
            </Link>
            <form action={signOutAction}>
              <button className="btn-ghost size-11 text-slate-600" aria-label="Sign out" title="Sign out">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-slate-100 px-2 py-1.5 md:hidden">
          <AppNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
