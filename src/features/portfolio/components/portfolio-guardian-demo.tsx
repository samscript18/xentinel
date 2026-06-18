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
import { usePortfolioIntrinsic, usePortfolioSystemic } from "@/hooks/use-portfolio-deep-analysis";
import { publishSelectedWallet } from "@/hooks/use-selected-wallet";
import { demoWallets } from "@/lib/demo-wallets";
import { formatAddress } from "@/lib/wallet/format-address";
import type { WalletAnalysis } from "@/types/risk";

function formatUsd(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		notation: value >= 1_000_000 ? "compact" : "standard",
		maximumFractionDigits: value >= 1_000 ? 0 : 2,
	}).format(value);
}

function hasRiskRatings(data: WalletAnalysis) {
	return data.rating !== "NR" || data.positions.some((position) => position.rating !== "NR" || position.intrinsicRisk > 0 || position.systemicRisk > 0);
}

export function PortfolioGuardianDemo() {
	const analysis = useAnalyzeWallet();
	const account = useAccount();
	const [lastWalletAddress, setLastWalletAddress] = useState("");
	const [walletInput, setWalletInput] = useState("");
	const response = analysis.data;
	const data = response?.meta.source === "unavailable" ? undefined : response?.data;
	const deepEnabled = Boolean(data && lastWalletAddress);
	const intrinsic = usePortfolioIntrinsic(lastWalletAddress, deepEnabled);
	const systemic = usePortfolioSystemic(lastWalletAddress, deepEnabled);
	const enrichedPositions = data?.positions ?? [];
	const enrichedData = data ? { ...data, positions: enrichedPositions } : undefined;
	const connectedAddress = account.address;
	const hasRiskData = enrichedData ? hasRiskRatings(enrichedData) : false;
	const hasPositions = Boolean(enrichedData?.positions.length);
	const intrinsicScore = intrinsic.data?.meta.source === "unavailable" ? undefined : intrinsic.data?.data.score;
	const systemicScore = systemic.data?.meta.source === "unavailable" ? undefined : systemic.data?.data.score;
	const highestRisk = enrichedData ? [...enrichedData.positions].sort((a, b) => b.intrinsicRisk + b.systemicRisk - (a.intrinsicRisk + a.systemicRisk))[0] : undefined;
	const riskDistribution = enrichedData
		? [
				{ name: "Safe", value: enrichedData.positions.filter((position) => ["AAA", "AA", "A"].includes(position.rating)).length, color: "#34d399" },
				{ name: "Caution", value: enrichedData.positions.filter((position) => ["BBB", "BB"].includes(position.rating)).length, color: "#fbbf24" },
				{ name: "Danger", value: enrichedData.positions.filter((position) => ["B", "C", "D"].includes(position.rating)).length, color: "#f87171" },
				{ name: "Unrated", value: enrichedData.positions.filter((position) => position.rating === "NR").length, color: "#64748b" },
			]
		: [];

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
			<SectionHeader eyebrow="Portfolio guardian" title="Wallet risk analysis" description="Submit a wallet to review wallet risk scores and any available position-level intelligence." />

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

			<section className="surface-panel rounded-lg p-5">
				<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Example wallets</p>
						<h2 className="mt-2 text-lg font-semibold text-white">Explore Xentinel quickly</h2>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">Public wallet examples for judges and reviewers. They are provided only to help test the product flow.</p>
					</div>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{demoWallets.map((wallet) => (
						<button
							key={wallet.address}
							type="button"
							className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/40"
							onClick={() => {
								setWalletInput(wallet.address);
								analyzeWallet(wallet.address);
							}}
						>
							<span className="text-sm font-semibold text-white">{wallet.label}</span>
							<span className="mt-2 block font-mono text-xs text-cyan-100">{formatAddress(wallet.address)}</span>
							<span className="mt-2 block text-xs leading-5 text-muted-foreground">{wallet.description}</span>
						</button>
					))}
				</div>
			</section>

			{analysis.isError ? <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">Analysis failed. Please try again.</div> : null}

			{response?.meta.source === "unavailable" ? (
				<LiveDataUnavailable
					title="No portfolio analysis yet"
					description="Run Portfolio Guardian to view wallet ratings, risk drivers, and position breakdowns."
					onRetry={lastWalletAddress ? () => analyzeWallet(lastWalletAddress) : undefined}
				/>
			) : null}

			{!response && !analysis.isPending ? <LiveDataUnavailable title="Enter a wallet to begin" description="Paste a wallet address or connect a browser wallet, then run Portfolio Guardian." /> : null}

			{enrichedData ? (
				<>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="relative">
							<MetricCard label="Overall Risk Score" value={hasRiskData ? `${enrichedData.overallRiskScore}/100` : "Not rated"} detail={`Wallet rating ${enrichedData.rating}`} tone="violet" />
						</div>
						<div className="relative">
							<MetricCard
								label="Intrinsic Risk"
								value={intrinsic.isLoading ? "Loading" : intrinsicScore !== undefined && intrinsicScore > 0 ? `${intrinsicScore}/100` : enrichedData.intrinsicRisk > 0 ? `${enrichedData.intrinsicRisk}/100` : "Unavailable"}
								detail={intrinsic.data?.data.risks[0] ?? "Protocol-native risk pressure"}
								tone="cyan"
							/>
						</div>
						<div className="relative">
							<MetricCard
								label="Systemic Risk"
								value={systemic.isLoading ? "Loading" : systemicScore !== undefined && systemicScore > 0 ? `${systemicScore}/100` : enrichedData.systemicRisk > 0 ? `${enrichedData.systemicRisk}/100` : "Unavailable"}
								detail={systemic.data?.data.summary ?? "Dependency and contagion exposure"}
								tone="amber"
							/>
						</div>
					</div>

					{intrinsic.data?.meta.source === "unavailable" ? (
						<div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
							{intrinsic.data.meta.warnings?.[0] ?? "Intrinsic risk details are temporarily unavailable."}
						</div>
					) : null}

					{systemic.data?.meta.source === "unavailable" ? (
						<div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
							{systemic.data.meta.warnings?.[0] ?? "Systemic risk details are temporarily unavailable."}
						</div>
					) : null}

					{!hasRiskData ? (
						<div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
							Position-level risk ratings are not available for this wallet yet. Wallet-level analysis is shown above when live rating data is available.
						</div>
					) : null}

					<div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
						{hasPositions ? (
							<section className="surface-panel min-w-0 rounded-lg p-5">
								<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
									<div>
										<h2 className="text-lg font-semibold text-white">Portfolio Positions</h2>
										<p className="text-sm text-muted-foreground">Position-level risk reasons for quick triage.</p>
									</div>
									<div className="flex items-center gap-2">
										<RiskBadge rating={enrichedData.rating} />
									</div>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full min-w-[760px] text-left text-sm">
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
											{enrichedData.positions.map((position) => (
												<tr key={position.id} className="align-top text-muted-foreground">
													<td className="px-4 py-4 font-medium text-white">{position.protocol}</td>
													<td className="px-4 py-4">{position.asset}</td>
													<td className="px-4 py-4">{formatUsd(position.valueUsd)}</td>
													<td className="px-4 py-4">
														<RiskBadge rating={position.rating} />
													</td>
													<td className="px-4 py-4">{position.rating === "NR" && position.intrinsicRisk === 0 ? "Pending" : `${position.intrinsicRisk}/100`}</td>
													<td className="px-4 py-4">{position.rating === "NR" && position.systemicRisk === 0 ? "Pending" : `${position.systemicRisk}/100`}</td>
													<td className="px-4 py-4 max-w-sm leading-6">{position.mainRiskReason}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>
						) : (
							<LiveDataUnavailable
								title="Position breakdown unavailable"
								description="Wallet-level risk can be analyzed even when live position records are not returned for this address."
							/>
						)}

						<div className="min-w-0 space-y-5">
							{highestRisk ? (
								<section className="surface-panel rounded-lg p-5">
									<div className="flex items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-300/20 bg-red-300/10 text-red-100">
											<AlertTriangle className="h-4 w-4" aria-hidden />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Highest-risk position</p>
											<h2 className="mt-1 text-xl font-semibold text-white">{highestRisk.protocol}</h2>
											<p className="mt-3 text-sm leading-6 text-muted-foreground">{highestRisk.mainRiskReason}</p>
										</div>
									</div>
								</section>
							) : null}

							{hasPositions ? (
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
												<p className="text-white">{item.value}</p>
												{item.name}
											</div>
										))}
									</div>
								</section>
							) : (
								<section className="surface-panel rounded-lg p-5">
									<div className="flex items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
											<Target className="h-4 w-4" aria-hidden />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Wallet-level mode</p>
											<h2 className="mt-1 text-xl font-semibold text-white">Position distribution pending</h2>
											<p className="mt-3 text-sm leading-6 text-muted-foreground">
												This address can still be assessed at wallet or entity level. A position distribution appears when the risk service returns portfolio records.
											</p>
										</div>
									</div>
								</section>
							)}
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
