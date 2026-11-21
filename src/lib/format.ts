import type { Experience } from "./core/types";

/** "2024-06" → "Jun 2024"; a year-only date ("2024") stays as the year. */
const fmtDate = (d: string) => {
  const [y, m] = d.split("-");
  return m ? new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short", year: "numeric" }) : y;
};

export function formatRange(e: Pick<Experience, "startDate" | "endDate">) {
  if (!e.startDate) return e.endDate ? fmtDate(e.endDate) : "";
  if (e.startDate === e.endDate) return fmtDate(e.startDate);
  return `${fmtDate(e.startDate)} – ${e.endDate ? fmtDate(e.endDate) : "Present"}`;
}

/** Characters the PDF's Helvetica (WinAnsi) cannot print, e.g. Thai marks that show up as stray glyphs. */
export const PDF_UNSAFE = /[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/gu;
