"use client";

import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useSmartMoney } from "@/hooks/use-smart-money";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SmartMoneyDemo() {
  const { data: response, isLoading, isError, refetch } = useSmartMoney();
  const wallets = response?.meta.source === "unavailable" ? [] : response?.data.wallets ?? [];
  const averageRiskScore = wallets.length > 0 ? Math.round(wallets.reduce((sum, wallet) => sum + wallet.performanceScore, 0) / wallets.length) : 0;
  const averageConfidence = wallets.length > 0 ? Math.round((wallets.reduce((sum, wallet) => sum + wallet.confidence, 0) / wallets.length) * 100) : 0;
  const movementChart = wallets.map((wallet) => ({
    label: wallet.label,
    exposureChange: wallet.exposureChangePercent
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Smart money sentinel"
        title="Elite wallet behavior versus your portfolio"
        description="Track high-performing wallets, compare allocation posture, and turn recent movements into portfolio risk context."
      />

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No smart wallet movement yet"
          description="Track high-performing wallets to compare their rotations, risk posture, and recent movements against your portfolio."
          onRetry={() => void refetch()}
        />
      ) : null}

      {response?.meta.source !== "unavailable" ? (
        <>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Tracked Wallets" value={String(wallets.length)} detail="Active smart wallet set" icon={<Users className="h-4 w-4" />} tone="cyan" />
        <MetricCard label="Avg Performance" value={`${averageRiskScore}/100`} detail="Live tracked wallets" icon={<Activity className="h-4 w-4" />} tone="green" />
        <MetricCard label="Exposure Signals" value={String(wallets.filter((wallet) => wallet.exposureChangePercent !== 0).length)} detail="Changed since previous snapshot" icon={<BarChart3 className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Signal Confidence" value={`${averageConfidence}%`} detail="Snapshot confidence average" icon={<TrendingUp className="h-4 w-4" />} tone="violet" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Exposure Change</h2>
          <p className="text-sm text-muted-foreground">Current tracked wallets versus their previous stored snapshot.</p>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementChart} margin={{ left: -12, right: 12, top: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                <Bar dataKey="exposureChange" name="Exposure change %" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Recent Movement Feed</h2>
          <div className="mt-5 space-y-4">
            {wallets.slice(0, 4).map((wallet) => (
              <div key={wallet.id} className="border-l border-primary/60 pl-4">
                <p className="font-medium text-white">{wallet.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{wallet.recentMove}</p>
                <p className="mt-1 text-xs text-cyan-100">{wallet.exposureChangePercent > 0 ? "+" : ""}{wallet.exposureChangePercent}% exposure change</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-panel overflow-hidden rounded-lg">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Smart Wallet Table</h2>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading smart wallet feed...</p> : null}
          {isError ? <p className="text-sm text-red-100">Could not load smart wallet feed.</p> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-white/[0.035] text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Wallet</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Performance</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Recent move</th>
                <th className="px-5 py-3">Exposure</th>
                <th className="px-5 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="text-muted-foreground">
                  <td className="px-5 py-4 font-medium text-white">{wallet.label}</td>
                  <td className="px-5 py-4 font-mono text-xs">{shortAddress(wallet.walletAddress)}</td>
                  <td className="px-5 py-4">{wallet.performanceScore}</td>
                  <td className="px-5 py-4"><RiskBadge rating={wallet.currentRiskRating} /></td>
                  <td className="px-5 py-4 max-w-sm">{wallet.recentMove}</td>
                  <td className="px-5 py-4">{wallet.exposureChangePercent > 0 ? "+" : ""}{wallet.exposureChangePercent}%</td>
                  <td className="px-5 py-4">{Math.round(wallet.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
