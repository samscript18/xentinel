"use client";

import { Activity, BarChart3, Plus, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddSmartWallet, useSmartMoney } from "@/hooks/use-smart-money";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SmartMoneyDemo() {
  const selectedWallet = useSelectedWallet();
  const { data: response, isLoading, isError, refetch } = useSmartMoney(selectedWallet);
  const addSmartWallet = useAddSmartWallet();
  const [favoriteWallet, setFavoriteWallet] = useState("");
  const [favoriteLabel, setFavoriteLabel] = useState("");
  const wallets = response?.meta.source === "unavailable" ? [] : response?.data.wallets ?? [];
  const comparison = response?.data.comparison;
  const averageRiskScore = comparison?.smartMoneyAverageRiskScore ?? 0;
  const averageConfidence = wallets.length > 0 ? Math.round((wallets.reduce((sum, wallet) => sum + wallet.confidence, 0) / wallets.length) * 100) : 0;
  const movementChart = wallets.map((wallet) => ({
    label: wallet.label,
    exposureChange: wallet.riskChangePercent
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Smart money sentinel"
        title="Elite wallet behavior versus your portfolio"
        description="Track high-performing wallets, compare allocation posture, and turn recent movements into portfolio risk context."
      />

      <form
        className="surface-panel grid gap-3 rounded-lg p-3 lg:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();

          if (!favoriteWallet.trim()) {
            return;
          }

          addSmartWallet.mutate({ walletAddress: favoriteWallet.trim(), label: favoriteLabel.trim() || undefined }, {
            onSuccess: () => {
              setFavoriteWallet("");
              setFavoriteLabel("");
            }
          });
        }}
      >
        <Input value={favoriteWallet} onChange={(event) => setFavoriteWallet(event.target.value)} placeholder="Add wallet address" />
        <Input value={favoriteLabel} onChange={(event) => setFavoriteLabel(event.target.value)} placeholder="Optional label" />
        <Button type="submit" className="gap-2" disabled={addSmartWallet.isPending}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Favorite
        </Button>
      </form>

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
        <MetricCard label="Smart Money Avg Risk" value={averageRiskScore > 0 ? `${averageRiskScore}/100` : "Pending"} detail={comparison?.smartMoneyAverageRating ? `Average rating ${comparison.smartMoneyAverageRating}` : "Risk average"} icon={<Activity className="h-4 w-4" />} tone="green" />
        <MetricCard label="Risk Changes" value={String(wallets.filter((wallet) => wallet.riskChangePercent !== 0).length)} detail="Changed since previous snapshot" icon={<BarChart3 className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Signal Confidence" value={`${averageConfidence}%`} detail="Snapshot confidence average" icon={<TrendingUp className="h-4 w-4" />} tone="violet" />
      </div>

      <section className="surface-panel rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Your portfolio vs smart money average</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {comparison?.status === "outperforming" ? "You are running lower risk" : comparison?.status === "lagging" ? "You are running higher risk" : comparison?.status === "in_line" ? "You are in line" : "Analyze a wallet to compare"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{comparison?.summary}</p>
          </div>
          <div className="grid min-w-[240px] grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">You</p>
              <p className="mt-2 text-2xl font-semibold text-white">{comparison?.userRiskScore !== undefined ? `${comparison.userRiskScore}/100` : "Pending"}</p>
              {comparison?.userRiskRating ? <div className="mt-2"><RiskBadge rating={comparison.userRiskRating} /></div> : null}
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Smart avg</p>
              <p className="mt-2 text-2xl font-semibold text-white">{averageRiskScore > 0 ? `${averageRiskScore}/100` : "Pending"}</p>
              {comparison?.smartMoneyAverageRating ? <div className="mt-2"><RiskBadge rating={comparison.smartMoneyAverageRating} /></div> : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
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

        <section className="surface-panel min-w-0 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Recent Movement Feed</h2>
          <div className="mt-5 max-h-[22rem] space-y-4 overflow-y-auto pr-1">
            {wallets.slice(0, 8).map((wallet) => (
              <div key={wallet.id} className="min-w-0 border-l border-primary/60 pl-4">
                <p className="break-words font-medium text-white">{wallet.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{wallet.recentMove}</p>
                <p className="mt-1 text-xs text-cyan-100">{wallet.riskChangePercent > 0 ? "+" : ""}{wallet.riskChangePercent}% risk change</p>
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
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Recent move</th>
                <th className="px-5 py-3">Change</th>
                <th className="px-5 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="text-muted-foreground">
                  <td className="px-5 py-4 font-medium text-white">{wallet.label}</td>
                  <td className="px-5 py-4 font-mono text-xs">{shortAddress(wallet.walletAddress)}</td>
                  <td className="px-5 py-4">{wallet.performanceScore}</td>
                  <td className="px-5 py-4">{wallet.currentRiskScore > 0 ? `${wallet.currentRiskScore}/100` : "Pending"}</td>
                  <td className="px-5 py-4"><RiskBadge rating={wallet.currentRiskRating} /></td>
                  <td className="px-5 py-4 max-w-sm">{wallet.recentMove}</td>
                  <td className="px-5 py-4">{wallet.riskChangePercent > 0 ? "+" : ""}{wallet.riskChangePercent}%</td>
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
