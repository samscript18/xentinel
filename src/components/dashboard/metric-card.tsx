import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "violet" | "cyan" | "green" | "amber" | "red";
}

const toneStyles: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  violet: "from-violet-500/18 to-transparent text-violet-100",
  cyan: "from-cyan-400/16 to-transparent text-cyan-100",
  green: "from-emerald-400/16 to-transparent text-emerald-100",
  amber: "from-amber-300/16 to-transparent text-amber-100",
  red: "from-red-400/16 to-transparent text-red-100"
};

export function MetricCard({ label, value, detail, icon, tone = "violet" }: MetricCardProps) {
  return (
    <div className={cn("surface-panel rounded-3xl bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:border-white/20", toneStyles[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal text-white md:text-[1.65rem]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          {icon ?? <ArrowUpRight className="h-4 w-4" aria-hidden />}
        </div>
      </div>
      {detail ? <p className="mt-4 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
