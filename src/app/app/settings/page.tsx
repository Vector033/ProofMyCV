import type { Metadata } from "next";
import { deleteAccountAction } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
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

      <section className="card border-red-200 p-5">
        <h2 className="font-medium text-red-800">Delete account</h2>
        <p className="mt-1 text-sm text-stone-600">
          Permanently deletes your account, fact bank and every application. This cannot be undone.
        </p>
        <form action={deleteAccountAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="label">Type &quot;delete&quot; to confirm</span>
            <input name="confirm" required pattern="delete" className="input" autoComplete="off" />
          </label>
          <button className="inline-flex rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
            Delete my account
          </button>
        </form>
      </section>
    </div>
  );
}
