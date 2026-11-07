import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isDemoUser } from "@/lib/supabase/admin";
import { deleteAccountAction, resetDemoAction } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const demo = isDemoUser((await requireUser()).email);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="card p-5">
        <h2 className="font-medium">Your data</h2>
        <p className="mt-1 text-sm text-stone-600">
          FactFit keeps your login email, the resume header you typed, your fact bank and your saved applications.
          Nothing else.
        </p>
        <a href="/app/settings/export" className="btn mt-4">
          Download everything (JSON)
        </a>
      </section>

      {demo ? (
        <section className="card p-5">
          <h2 className="font-medium">Demo account</h2>
          <p className="mt-1 text-sm text-stone-600">
            Everyone who opens the demo shares this account and its fictional data, so it cannot be deleted. Put it back
            to the starting fact bank and sample job if someone has changed it.
          </p>
          <form action={resetDemoAction} className="mt-4">
            <button className="btn">Reset demo data</button>
          </form>
        </section>
      ) : (
      <section className="card border-red-200 p-5">
        <h2 className="font-medium text-red-800">Delete my data</h2>
        <p className="mt-1 text-sm text-stone-600">
          Permanently deletes your resume header, fact bank and every application. This cannot be undone. You are signed
          out afterwards.
        </p>
        <form action={deleteAccountAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="label">Type &quot;delete&quot; to confirm</span>
            <input
              name="confirm"
              required
              pattern="\s*[Dd][Ee][Ll][Ee][Tt][Ee]\s*"
              title="Type the word delete"
              aria-describedby="delete-hint"
              className="input"
              autoComplete="off"
            />
            <span id="delete-hint" className="hint">
              Type the word delete. Download your data first if you want a copy.
            </span>
          </label>
          <button className="press inline-flex min-h-10 items-center rounded-md bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800">
            Delete my data
          </button>
        </form>
      </section>
      )}
    </div>
  );
}
