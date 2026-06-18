"use client";

import { AlertTriangle, Clock, Gauge, Layers, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";
import { useStressTesting } from "@/hooks/use-stress-testing";
import { cn } from "@/lib/utils/cn";

const severityStyles = {
  moderate: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  high: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  critical: "border-red-300/25 bg-red-300/10 text-red-100"
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0
  }).format(value);
}

export function StressTestingDemo() {
  const walletAddress = useSelectedWallet();
  const { data: response, isError, isLoading, refetch } = useStressTesting(walletAddress);
  const stress = response?.meta.source === "unavailable" ? undefined : response?.data;

  const chartData = stress?.exitLiquidityLadder.map((step) => ({
    window: step.window,
    exitable: step.exitablePercent,
    slippage: step.expectedSlippagePercent
  })).filter((step) => step.exitable > 0 || step.slippage > 0) ?? [];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Stress Testing Engine"
        title="What happens if the market breaks?"
        description="Run market shocks against the wallet: ETH drawdowns, USDC depeg pressure, exit liquidity, liquidation buffers, crowding queues, and downside timing."
      />

      {isLoading ? <p className="text-sm text-muted-foreground">Loading stress test scenarios...</p> : null}
      {isError ? <p className="text-sm text-red-100">Could not load stress testing data.</p> : null}

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No stress results yet"
          description="Analyze a wallet in Portfolio Guardian or connect a wallet, then return here to view scenario analysis, exit liquidity, and crowding queues."
          onRetry={() => void refetch()}
        />
      ) : null}

      {stress ? (
        <>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Panic Meter" value={`${stress.panicMeter}/100`} detail="1-day exit pressure" icon={<Gauge className="h-4 w-4" />} tone="red" />
        <MetricCard label="Downside Exposure" value={formatUsd(stress.downsideExposureUsd)} detail="Not exitable inside 1 day" icon={<ShieldAlert className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Liquidation Buffer" value={`${stress.liquidationBufferPercent}%`} detail="Levered debt headroom" icon={<Layers className="h-4 w-4" />} tone="cyan" />
        <MetricCard label="Crowding Queue" value={stress.crowdingQueueRank} detail="Exit queue status" icon={<Clock className="h-4 w-4" />} tone="violet" />
      </div>

      <section className="surface-panel rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-300/20 bg-red-300/10 text-red-100">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Stress Summary</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{stress.headline}</p>
            <p className="mt-2 text-sm leading-6 text-cyan-100">{stress.downsideTiming}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Exit Liquidity Ladder</h2>
          <p className="mt-1 text-sm text-muted-foreground">How much can exit, and how expensive does it get as panic builds?</p>
          {chartData.length > 0 ? (
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -12, right: 12, top: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="window" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                  <Bar dataKey="exitable" name="Exitable %" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="slippage" name="Expected slippage %" fill="#f87171" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-muted-foreground">
              Xerberus returned liquidity bands for this wallet, but no numeric exit percentages for charting.
            </div>
          )}
        </section>

        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Liquidity Notes</h2>
          <div className="mt-5 space-y-3">
            {stress.exitLiquidityLadder.map((step, index) => (
              <div key={`${step.window}-${index}`} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{step.window}</p>
                  <p className="text-sm text-cyan-100">{step.exitablePercent > 0 ? `${step.exitablePercent}% exitable` : "Liquidity band"}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {stress.scenarios.map((scenario) => (
          <article key={scenario.id} className={cn("rounded-lg border p-5", severityStyles[scenario.severity])}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{scenario.severity}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{scenario.name}</h2>
            <p className="mt-3 text-sm leading-6 opacity-80">{scenario.impactSummary}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="text-xs opacity-70">Drawdown</p>
                <p className="mt-1 text-2xl font-semibold text-white">{scenario.portfolioDrawdownPercent}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="text-xs opacity-70">Systemic risk</p>
                <p className="mt-1 text-2xl font-semibold text-white">{scenario.systemicRiskAfterShock}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
        </>
      ) : null}
    </div>
  );
}
