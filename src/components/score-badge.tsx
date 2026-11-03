export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const tone =
    score >= 75 ? "bg-emerald-100 text-emerald-800" : score >= 45 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  const dims = size === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums ${tone} ${dims}`}>
      {score}%
    </span>
  );
}
