import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "./actions";
import { AppNav } from "./nav";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 px-4 sm:flex-nowrap sm:px-6">
          <Link href="/app" className="flex min-h-12 items-center rounded-sm font-semibold tracking-tight text-stone-900">
            Fact<span className="text-emerald-700">Fit</span>
          </Link>
          <AppNav />
          <div className="ml-auto flex min-w-0 items-center gap-3 text-sm text-stone-500">
            <span className="hidden max-w-[16rem] truncate md:inline" title={user.email ?? undefined}>
              {user.email}
            </span>
            <form action={signOutAction}>
              <button className="btn btn-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
