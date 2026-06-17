"use client";

import { AlertTriangle, Eye, Radar, TrendingDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useRiskMigration } from "@/hooks/use-risk-migration";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";

export function RiskMigrationDemo() {
  const walletAddress = useSelectedWallet();
  const { data: response, isLoading, isError, refetch } = useRiskMigration(walletAddress);
  const detector = response?.meta.source === "unavailable" ? undefined : response?.data;
  const events = detector?.events ?? [];
  const panicMeter = detector?.panicMeter ?? 0;
  const trendSeries = events.map((event, index) => ({
    point: event.protocol,
    pressure: event.downgradeProbability,
    confidence: Math.round(event.confidence * 100),
    order: index + 1
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Panic / Outflow Detector"
        title="Is panic building before the market reacts?"
        description="Track unusual outflows, rating drift, sudden systemic risk spikes, smart wallet exits, and vault/protocol stress in one early-warning surface."
      />

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No panic signals yet"
          description="Analyze a wallet in Portfolio Guardian or connect a wallet, then return here to view outflow signals, rating drift, and panic pressure."
          onRetry={() => void refetch()}
        />
      ) : null}

      {detector ? (
        <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Smart Money Exits Detected" value={String(events.filter((event) => event.smartWalletMovement !== "No tracked wallet exit signal detected.").length)} detail="Tracked wallet reductions" icon={<TrendingDown className="h-4 w-4" />} tone="red" />
        <MetricCard label="Panic Probability" value={`${panicMeter}%`} detail="Current systemic pressure" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Protocols Under Watch" value={String(events.length)} detail="Active watchlist" icon={<Eye className="h-4 w-4" />} tone="cyan" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="surface-panel rounded-lg p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Panic Pressure Index</h2>
              <p className="text-sm text-muted-foreground">Rising score indicates outflow pressure and systemic stress.</p>
            </div>
            <Radar className="h-5 w-5 text-cyan-100" aria-hidden />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries} margin={{ left: -12, right: 12, top: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="point" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="pressure" stroke="#a78bfa" strokeWidth={3} dot />
                <Line type="monotone" dataKey="confidence" stroke="#22d3ee" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Protocols Under Watch</h2>
          <div className="mt-5 space-y-3">
            {events.map((item) => (
              <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.protocol}</p>
                    <p className="text-sm text-muted-foreground">{item.signal}</p>
                  </div>
                  <RiskBadge rating={item.newRating} />
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${item.downgradeProbability}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-panel rounded-lg p-5">
        <h2 className="text-lg font-semibold text-white">Panic Signal Timeline</h2>
        {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading panic and outflow signals...</p> : null}
        {isError ? <p className="mt-4 text-sm text-red-100">Could not load panic detector data.</p> : null}
        <div className="mt-6 space-y-5">
          {events.map((event) => (
            <article key={event.id} className="relative rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-white">{event.protocol}</span>
                  <RiskBadge rating={event.oldRating} />
                  <span className="text-sm text-muted-foreground">to</span>
                  <RiskBadge rating={event.newRating} />
                </div>
                <div className="text-sm text-muted-foreground">{event.timeframe} window · {Math.round(event.confidence * 100)}% confidence</div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Stress reason</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.reason}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Smart wallet movement</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.smartWalletMovement}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Panic probability</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{event.downgradeProbability}%</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
