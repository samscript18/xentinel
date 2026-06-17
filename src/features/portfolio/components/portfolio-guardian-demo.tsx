"use client";

import { AlertTriangle, Loader2, ShieldCheck, Target } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAccount } from "wagmi";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalyzeWallet } from "@/hooks/use-analyze-wallet";
import { publishSelectedWallet } from "@/hooks/use-selected-wallet";
import { formatAddress } from "@/lib/wallet/format-address";

export function PortfolioGuardianDemo() {
  const analysis = useAnalyzeWallet();
  const account = useAccount();
  const [lastWalletAddress, setLastWalletAddress] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const response = analysis.data;
  const data = response?.meta.source === "unavailable" ? undefined : response?.data;
  const meta = response?.meta;
  const connectedAddress = account.address;
  const highestRisk = data ? [...data.positions].sort(
    (a, b) => b.intrinsicRisk + b.systemicRisk - (a.intrinsicRisk + a.systemicRisk)
  )[0] : undefined;
  const riskDistribution = data ? [
    { name: "Safe", value: data.positions.filter((position) => ["AAA", "AA", "A"].includes(position.rating)).length, color: "#34d399" },
    { name: "Caution", value: data.positions.filter((position) => ["BBB", "BB"].includes(position.rating)).length, color: "#fbbf24" },
    { name: "Danger", value: data.positions.filter((position) => ["B", "C", "D"].includes(position.rating)).length, color: "#f87171" }
  ] : [];

  function analyzeWallet(walletAddress: string) {
    const trimmedWalletAddress = walletAddress.trim();

    if (!trimmedWalletAddress) {
      return;
    }

    setLastWalletAddress(trimmedWalletAddress);
    publishSelectedWallet(trimmedWalletAddress);
    analysis.mutate(trimmedWalletAddress);
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Portfolio guardian"
        title="Wallet risk analysis"
        description="Submit a wallet to review risk scores, position-level reasons, and distribution analytics for the current portfolio."
      />

      <form
        className="surface-panel grid gap-3 rounded-lg p-3 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          analyzeWallet(walletInput.trim() || connectedAddress || "");
        }}
      >
        <div className="grid gap-2">
          <Input
            name="walletAddress"
            value={walletInput}
            onChange={(event) => setWalletInput(event.target.value)}
            placeholder={connectedAddress ? `Connected: ${formatAddress(connectedAddress)}` : "Paste wallet address"}
          />
          {connectedAddress ? (
            <p className="px-1 text-xs text-muted-foreground">
              Connected wallet available: <span className="text-cyan-100">{formatAddress(connectedAddress)}</span>. Leave the field empty to analyze it.
            </p>
          ) : (
            <p className="px-1 text-xs text-muted-foreground">Paste any wallet address, or connect MetaMask/Rabby from the header.</p>
          )}
        </div>
        <Button type="submit" className="gap-2 shadow-glow" disabled={analysis.isPending}>
          {analysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
          Analyze
        </Button>
      </form>

      {analysis.isError ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          Analysis failed. Please try again.
        </div>
      ) : null}

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No portfolio analysis yet"
          description="Run Portfolio Guardian to view wallet ratings, risk drivers, and position breakdowns."
          onRetry={lastWalletAddress ? () => analyzeWallet(lastWalletAddress) : undefined}
        />
      ) : null}

      {!response && !analysis.isPending ? (
        <LiveDataUnavailable
          title="Enter a wallet to begin"
          description="Paste a wallet address or connect a browser wallet, then run Portfolio Guardian."
        />
      ) : null}

      {data ? (
        <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Overall Risk Score" value={`${data.overallRiskScore}/100`} detail={`Wallet rating ${data.rating}`} tone="violet" />
        <MetricCard label="Intrinsic Risk" value={`${data.intrinsicRisk}/100`} detail="Protocol-native risk pressure" tone="cyan" />
        <MetricCard label="Systemic Risk" value={`${data.systemicRisk}/100`} detail="Dependency and contagion exposure" tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="surface-panel rounded-lg p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Portfolio Positions</h2>
              <p className="text-sm text-muted-foreground">Position-level risk reasons for quick triage.</p>
            </div>
            <RiskBadge rating={data.rating} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-white/10 bg-white/[0.035] text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Protocol</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Intrinsic</th>
                  <th className="px-4 py-3">Systemic</th>
                  <th className="px-4 py-3">Main risk reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.positions.map((position) => (
                  <tr key={position.protocol} className="align-top text-muted-foreground">
                    <td className="px-4 py-4 font-medium text-white">{position.protocol}</td>
                    <td className="px-4 py-4">{position.asset}</td>
                    <td className="px-4 py-4">${position.valueUsd.toLocaleString()}</td>
                    <td className="px-4 py-4"><RiskBadge rating={position.rating} /></td>
                    <td className="px-4 py-4">{position.intrinsicRisk}/100</td>
                    <td className="px-4 py-4">{position.systemicRisk}/100</td>
                    <td className="px-4 py-4 max-w-sm leading-6">{position.mainRiskReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          <section className="surface-panel rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-300/20 bg-red-300/10 text-red-100">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest-risk position</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{highestRisk?.protocol}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{highestRisk?.mainRiskReason}</p>
              </div>
            </div>
          </section>

          <section className="surface-panel rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Risk Distribution</h2>
              <Target className="h-4 w-4 text-cyan-100" aria-hidden />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              {riskDistribution.map((item) => (
                <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                  <p className="text-white">{item.value}%</p>
                  {item.name}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
        </>
      ) : null}
    </div>
  );
}
