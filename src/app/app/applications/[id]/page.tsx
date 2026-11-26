import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApplication, getFactBank, getProfile } from "@/lib/data";
import { getLlm } from "@/lib/llm/provider";
import { updateStatusAction } from "../../actions";
import { APPLICATION_STATUSES, STATUS_LABEL } from "@/lib/core/types";
import { ApplicationWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params, searchParams }: PageProps<"/app/applications/[id]">) {
  const { id } = await params;
  const { reanalysed } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [app, bank, profile] = await Promise.all([getApplication(id), getFactBank(), getProfile()]);
  if (!app) notFound();

  return (
    <ApplicationWorkspace
      application={{
        id: app.id,
        company: app.company,
        role: app.role,
        analyzedBy: app.analyzedBy,
        analysis: app.analysis,
        bullets: app.bullets,
      }}
      profile={{
        fullName: profile.fullName,
        headline: profile.headline,
        contact: profile.contact,
        links: profile.links,
      }}
      initialExperiences={bank.experiences}
      initialFacts={bank.facts}
      canGenerate={getLlm() !== null}
      reanalysed={typeof reanalysed === "string" ? reanalysed : undefined}
      statusForm={
        <form action={updateStatusAction.bind(null, app.id)} className="card flex flex-wrap items-end gap-3 p-4">
          <label className="block">
            <span className="label">Status</span>
            <select name="status" defaultValue={app.status} className="input w-auto">
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Deadline</span>
            <input type="date" name="deadline" defaultValue={app.deadline ?? ""} className="input w-auto tabular-nums" />
          </label>
          <label className="block min-w-0 flex-1 basis-56">
            <span className="label">Note</span>
            <input name="statusNote" maxLength={200} defaultValue={app.statusNote} placeholder="e.g. Online test 6–12 Jan" className="input" />
          </label>
          <button className="btn">Save status</button>
        </form>
      }
    />
  );
}
