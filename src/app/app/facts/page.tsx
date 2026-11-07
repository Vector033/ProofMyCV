import type { Metadata } from "next";
import { getFactBank, getProfile } from "@/lib/data";
import type { Experience, Fact } from "@/lib/core/types";
import { formatRange } from "@/lib/format";
import {
  createExperienceAction,
  createFactAction,
  deleteExperienceAction,
  deleteFactAction,
  saveProfileAction,
  updateExperienceAction,
  updateFactAction,
} from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

export const metadata: Metadata = { title: "Fact bank" };

const KIND_LABEL: Record<Experience["kind"], string> = {
  job: "Work",
  project: "Project",
  education: "Education",
  activity: "Activity",
};

export default async function FactsPage() {
  const [profile, bank] = await Promise.all([getProfile(), getFactBank()]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fact bank</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
            Write what really happened, in plain words. Bullets may only use the numbers and technologies you put here,
            so be specific: <em>what you did</em>, <em>what changed</em>, <em>the number</em>.
          </p>
        </div>
        <p className="text-sm text-stone-500 tabular-nums">
          {bank.facts.length} {bank.facts.length === 1 ? "fact" : "facts"} · {bank.experiences.length}{" "}
          {bank.experiences.length === 1 ? "entry" : "entries"}
        </p>
      </header>


      <section className="space-y-4">
        <h2 className="font-medium">Experience, projects and education</h2>
        {bank.experiences.length === 0 && (
          <p className="text-sm text-stone-600">Nothing here yet. Add your first job, project or degree below.</p>
        )}
        {bank.experiences.map((e) => (
          <ExperienceCard key={e.id} experience={e} facts={bank.facts.filter((f) => f.experienceId === e.id)} />
        ))}

        <details className="group rounded-xl border border-dashed border-stone-300 bg-white/60 p-5 open:border-solid open:border-stone-200/80 open:bg-white" open={bank.experiences.length === 0}>
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 font-medium text-stone-800 [&::-webkit-details-marker]:hidden">
            <Plus /> Add experience, project or degree
          </summary>
          <ExperienceForm action={createExperienceAction} submit="Add experience" />
        </details>
      </section>

      <section className="card p-5">
        <h2 className="font-medium">Resume header</h2>
        <p className="mt-1 text-sm text-stone-600">The top of your exported PDF.</p>
        <form action={saveProfileAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="fullName" label="Full name" defaultValue={profile.fullName} />
          <Field name="headline" label="Headline" defaultValue={profile.headline} placeholder="Computer Science student, Chiang Mai University" />
          <Field name="contact" label="Contact line" defaultValue={profile.contact} placeholder="you@example.com · Bangkok" />
          <Field name="links" label="Links" defaultValue={profile.links} placeholder="github.com/you · you.dev" />
          <div className="sm:col-span-2">
            <button className="btn">Save header</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ExperienceCard({ experience: e, facts }: { experience: Experience; facts: Fact[] }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start gap-3 border-b border-stone-100 p-5">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            {KIND_LABEL[e.kind]} · {formatRange(e) || "No dates"} · {facts.length} {facts.length === 1 ? "fact" : "facts"}
          </p>
          <h3 className="mt-1.5 font-medium [overflow-wrap:anywhere] text-stone-900">
            {e.title}
            {e.org && <span className="font-normal text-stone-600"> · {e.org}</span>}
          </h3>
        </div>
        <details className="w-full text-sm sm:w-auto [&[open]]:w-full">
          <summary className="btn btn-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden">Edit details</summary>
          <div className="mt-3 w-full">
            <ExperienceForm action={updateExperienceAction.bind(null, e.id)} submit="Save" initial={e} />
            <form action={deleteExperienceAction.bind(null, e.id)} className="mt-3">
              <ConfirmButton
                confirm={`Delete "${e.title}" and its ${facts.length} ${facts.length === 1 ? "fact" : "facts"}? This cannot be undone.`}
                className="btn-danger"
              >
                Delete experience and its {facts.length} {facts.length === 1 ? "fact" : "facts"}
              </ConfirmButton>
            </form>
          </div>
        </details>
      </div>

      <ul className="divide-y divide-stone-100">
        {facts.map((f) => (
          <li key={f.id} className="px-5 py-3.5">
            <details className="group">
              <summary className="flex cursor-pointer list-none gap-3 rounded-md [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-900 [overflow-wrap:anywhere]">{f.did}</p>
                {f.result && (
                  <p className="mt-0.5 border-l-2 border-stone-300 pl-2 text-sm text-stone-700 [overflow-wrap:anywhere]">{f.result}</p>
                )}
                {f.tech.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {f.tech.map((t) => (
                      <span key={t} className="max-w-full rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-600 [overflow-wrap:anywhere]">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
                </div>
                <span className="shrink-0 pt-0.5 text-xs text-stone-500 group-open:hidden">Edit</span>
                <span className="hidden shrink-0 pt-0.5 text-xs text-stone-500 group-open:inline">Close</span>
              </summary>
              <FactForm action={updateFactAction.bind(null, f.id)} submit="Save fact" initial={f} />
              <form action={deleteFactAction.bind(null, f.id)} className="mt-2">
                <ConfirmButton confirm="Delete this fact? Bullets that cite it will be blocked." className="btn-danger">
                  Delete fact
                </ConfirmButton>
              </form>
            </details>
          </li>
        ))}
      </ul>

      <details className="border-t border-stone-100 px-5 py-3" open={facts.length === 0}>
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-emerald-800 [&::-webkit-details-marker]:hidden">
          <Plus /> Add fact
        </summary>
        <FactForm action={createFactAction.bind(null, e.id)} submit="Add fact" />
      </details>
    </article>
  );
}

function ExperienceForm({
  action,
  submit,
  initial,
}: {
  action: (fd: FormData) => Promise<void>;
  submit: string;
  initial?: Experience;
}) {
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="label">Type</span>
        <select name="kind" defaultValue={initial?.kind ?? "job"} className="input">
          {Object.entries(KIND_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <Field name="title" label="Title" required defaultValue={initial?.title} placeholder="Software Architect / B.Sc. Computer Science" />
      <Field name="org" label="Organisation" defaultValue={initial?.org} placeholder="Company, team or university" />
      <Field name="location" label="Location" defaultValue={initial?.location ?? ""} />
      <Field name="startDate" label="Start" type="month" defaultValue={initial?.startDate ?? ""} />
      <Field name="endDate" label="End (empty = present)" type="month" defaultValue={initial?.endDate ?? ""} />
      <div className="sm:col-span-2">
        <button className="btn-primary">{submit}</button>
      </div>
    </form>
  );
}

function FactForm({
  action,
  submit,
  initial,
}: {
  action: (fd: FormData) => Promise<void>;
  submit: string;
  initial?: Fact;
}) {
  return (
    <form action={action} className="mt-3 grid gap-3">
      <label className="block">
        <span className="label">What you did</span>
        <textarea
          name="did"
          required
          minLength={3}
          rows={2}
          defaultValue={initial?.did}
          placeholder="Split the monolith into 3 FastAPI services and led the API design"
          className="input"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="result" label="Result (with the number, if there is one)" defaultValue={initial?.result ?? ""} placeholder="Report generation went from 40 s to 6 s" />
        <Field name="tech" label="Technologies (comma separated)" defaultValue={initial?.tech.join(", ")} placeholder="FastAPI, Vue, Firestore" />
      </div>
      <div>
        <button className="btn">{submit}</button>
      </div>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="fill-none stroke-current stroke-2">
      <path d="M7 2.5v9M2.5 7h9" strokeLinecap="round" />
    </svg>
  );
}
