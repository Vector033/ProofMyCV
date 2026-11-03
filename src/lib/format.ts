import type { Experience } from "./core/types";

const fmtMonth = (d: string) => {
  const [y, m] = d.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short", year: "numeric" });
};

export function formatRange(e: Pick<Experience, "startDate" | "endDate">) {
  if (!e.startDate) return e.endDate ? fmtMonth(e.endDate) : "";
  return `${fmtMonth(e.startDate)} – ${e.endDate ? fmtMonth(e.endDate) : "Present"}`;
}
