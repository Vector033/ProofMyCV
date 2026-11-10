import type { Metadata } from "next";
import { getAccount } from "@/lib/account";
import { deleteAccountAction, resetDemoAction } from "../../actions";
import { Row, Section } from "../ui";

export const metadata: Metadata = { title: "Your data" };

export default async function DataPage() {
  const { demo } = await getAccount();
  return (
    <div className="space-y-8">
      <Section
        title="What FactFit keeps"
        description={"Your login email, the resume header you typed, your fact bank and your saved applications. Nothing\u00A0else."}
      >
        <Row label="Download" hint="Everything above, as one JSON file.">
          <a href="/app/settings/export" className="btn">
            Download everything (JSON)
          </a>
        </Row>
      </Section>

      {demo ? (
        <Section
          title="Demo account"
          description="Everyone who opens the demo shares this account and its fictional data, so it cannot be deleted."
        >
          <Row label="Reset" hint="Put back the starting fact bank and sample job if someone has changed them.">
            <form action={resetDemoAction}>
              <button className="btn">Reset demo data</button>
            </form>
          </Row>
        </Section>
      ) : (
        <Section title="Delete my data" description="Permanently deletes your resume header, fact bank and every application.">
          <Row label="Delete" hint="This cannot be undone. You are signed out afterwards.">
            <form action={deleteAccountAction} className="flex max-w-md flex-wrap items-end gap-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
              <div className="min-w-0 flex-1">
                <label htmlFor="confirm-delete" className="label">
                  Type &quot;delete&quot; to confirm
                </label>
                <input
                  id="confirm-delete"
                  name="confirm"
                  required
                  pattern="\s*[Dd][Ee][Ll][Ee][Tt][Ee]\s*"
                  title="Type the word delete"
                  aria-describedby="delete-hint"
                  className="input"
                  autoComplete="off"
                />
                <span id="delete-hint" className="hint">
                  Download your data first if you want a copy.
                </span>
              </div>
              <button className="press inline-flex min-h-10 items-center rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800">
                Delete my data
              </button>
            </form>
          </Row>
        </Section>
      )}
    </div>
  );
}
