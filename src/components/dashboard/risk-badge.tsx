import { cn } from "@/lib/utils/cn";
import type { RiskRating } from "@/types/risk";

const ratingStyles: Record<RiskRating, string> = {
  AAA: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  AA: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  A: "border-lime-400/30 bg-lime-400/12 text-lime-200",
  BBB: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  BB: "border-orange-300/35 bg-orange-300/12 text-orange-100",
  B: "border-orange-400/40 bg-orange-400/12 text-orange-100",
  C: "border-red-400/40 bg-red-400/12 text-red-100",
  D: "border-red-500/45 bg-red-500/15 text-red-100",
  NR: "border-slate-400/25 bg-slate-400/10 text-slate-200"
};

export function RiskBadge({ rating, className }: { rating: RiskRating; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-12 items-center justify-center rounded-md border px-2.5 py-1 text-xs font-bold tracking-normal",
        ratingStyles[rating],
        className
      )}
    >
      {rating}
    </span>
  );
}
