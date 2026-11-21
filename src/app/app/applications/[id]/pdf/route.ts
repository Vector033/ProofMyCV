import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getApplication, getFactBank, getProfile } from "@/lib/data";
import { ResumeDocument } from "@/lib/pdf/resume";

export async function GET(req: Request, ctx: RouteContext<"/app/applications/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [app, bank, profile] = await Promise.all([getApplication(id), getFactBank(), getProfile()]);
  if (!app) return new Response("Not found", { status: 404 });

  const doc = createElement(ResumeDocument, {
    educationFirst: new URL(req.url).searchParams.get("education") === "first",
    data: { profile, experiences: bank.experiences, facts: bank.facts, bullets: app.bullets, analysis: app.analysis },
  }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);

  const slug = [profile.fullName, app.company, app.role]
    .filter(Boolean)
    .join("_")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 56) // with ".pdf", at most 60 characters
    .replace(/_+$/, "");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${slug || "resume"}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
