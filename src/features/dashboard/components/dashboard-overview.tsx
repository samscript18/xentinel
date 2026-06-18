"use client";

import Link from "next/link";
import { ArrowRight, Bot, FileText, Gauge, GitBranch, Radar, ShieldAlert, WalletCards } from "lucide-react";
import { useAccount } from "wagmi";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useContagion } from "@/hooks/use-contagion";
import { useRiskMigration } from "@/hooks/use-risk-migration";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";
import { useSmartMoney } from "@/hooks/use-smart-money";
import { useStressTesting } from "@/hooks/use-stress-testing";
import { useWalletAnalysis } from "@/hooks/use-wallet-analysis";
import { formatAddress } from "@/lib/wallet/format-address";

const ctas = [
	{
		href: "/dashboard/portfolio",
		title: "Portfolio Guardian",
		description: "Is my money safe right now?",
		icon: WalletCards,
	},
	{
		href: "/dashboard/stress-testing",
		title: "Stress Testing Engine",
		description: "What happens if the market breaks?",
		icon: Gauge,
	},
	{
		href: "/dashboard/risk-migration",
		title: "Panic / Outflow Detector",
		description: "Is panic building before everyone notices?",
		icon: ShieldAlert,
	},
	{
		href: "/dashboard/smart-money",
		title: "Smart Money Sentinel",
		description: "Are smart wallets exiting?",
		icon: Radar,
	},
	{
		href: "/dashboard/contagion",
		title: "Contagion Radar",
		description: "Which dependencies can break my position?",
		icon: GitBranch,
	},
	{
		href: "/dashboard/copilot",
		title: "AI Chat Co-Pilot",
		description: "What should I pay attention to?",
		icon: Bot,
	},
	{
		href: "/dashboard/outputs",
		title: "Beautiful Outputs",
		description: "Share risk reports, charts, and alerts.",
		icon: FileText,
	},
];

function isLiveSource(source?: string) {
	return source === "xerberus" || source === "mixed";
}

export function DashboardOverview() {
	const account = useAccount();
	const walletAddress = useSelectedWallet();
	const portfolio = useWalletAnalysis(walletAddress);
	const stress = useStressTesting(walletAddress);
	const panic = useRiskMigration(walletAddress);
	const contagion = useContagion(walletAddress);
	const smartMoney = useSmartMoney(walletAddress);

	const hasAnyLiveData = [portfolio.data?.meta.source, stress.data?.meta.source, panic.data?.meta.source, contagion.data?.meta.source, smartMoney.data?.meta.source].some(isLiveSource);
	const portfolioData = isLiveSource(portfolio.data?.meta.source) ? portfolio.data?.data : undefined;
	const stressData = isLiveSource(stress.data?.meta.source) ? stress.data?.data : undefined;
	const panicData = isLiveSource(panic.data?.meta.source) ? panic.data?.data : undefined;
	const smartWalletCount = isLiveSource(smartMoney.data?.meta.source) ? (smartMoney.data?.data.wallets.length ?? 0) : 0;

	return (
		<div className="space-y-8">
			<SectionHeader
				eyebrow="Xentinel command center"
				title="Know your risk. Watch the smart money. Stay ahead of the panic."
				description="An AI-powered DeFi risk Co-Pilot and Smart Money Sentinel for regular users and traders who need clear, daily risk decisions instead of another generic dashboard."
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Overall Portfolio Risk"
					value={portfolioData ? `${portfolioData.overallRiskScore}/100` : "Run scan"}
					detail={portfolioData ? `Rating ${portfolioData.rating}` : "Portfolio Guardian"}
					tone={portfolioData ? "violet" : "amber"}
				/>
				<MetricCard
					label="Stress Test Summary"
					value={stressData ? `${stressData.panicMeter}/100` : "Run test"}
					detail={stressData ? "Panic meter after shocks" : "Stress Testing Engine"}
					tone={stressData ? "red" : "amber"}
				/>
				<MetricCard
					label="Smart Money Feed"
					value={smartWalletCount > 0 ? String(smartWalletCount) : "No signals"}
					detail={smartWalletCount > 0 ? "wallets tracked" : "Smart Money Sentinel"}
					tone={smartWalletCount > 0 ? "cyan" : "amber"}
				/>
				<MetricCard
					label="Wallet"
					value={walletAddress ? formatAddress(walletAddress) : "Select wallet"}
					detail={account.address ? "Connected wallet active" : "Paste address in Portfolio Guardian"}
					tone={walletAddress ? "green" : "amber"}
				/>
			</div>

			{!hasAnyLiveData ? (
				<LiveDataUnavailable title="Start with a wallet scan" description="Enter a wallet address to unlock portfolio risk, stress scenarios, panic signals, contagion paths, and smart-money movement." />
			) : null}

			<section className="surface-panel rounded-lg p-5">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-white">Wallet Analysis Entry Point</h2>
						<p className="mt-1 text-sm text-muted-foreground">Connect a wallet or keep using manual address paste. Xentinel does not request signatures.</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Link
							href="/dashboard/portfolio"
							className="inline-flex h-auto items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90"
						>
							Open Portfolio Guardian
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Link>
					</div>
				</div>
			</section>

			{hasAnyLiveData ? (
				<div className="grid gap-5 xl:grid-cols-[1fr_420px]">
					<section className="surface-panel rounded-lg p-5">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="text-lg font-semibold text-white">Panic / Outflow Detector</h2>
								<p className="text-sm text-muted-foreground">Unusual outflows, rating drift, sudden systemic spikes, and smart wallet exits.</p>
							</div>
							<ShieldAlert className="h-5 w-5 text-red-100" aria-hidden />
						</div>
						<div className="mt-5 space-y-4">
							{panicData?.events.slice(0, 3).map((event) => (
								<div key={event.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-semibold text-white">{event.protocol}</span>
										<span className="rounded-md border border-red-300/20 bg-red-300/10 px-2 py-1 text-xs text-red-100">{event.downgradeProbability}% panic risk</span>
									</div>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{event.signal}</p>
								</div>
							))}
						</div>
					</section>

					<section className="surface-panel rounded-lg p-5">
						<h2 className="text-lg font-semibold text-white">Beautiful Outputs</h2>
						<div className="mt-4 grid gap-3">
							{["PDF risk report", "Risk chart visuals", "Rating-drift alerts"].map((item) => (
								<Link
									key={item}
									href="/dashboard/outputs"
									className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground transition hover:border-cyan-300/30 hover:text-white"
								>
									<FileText className="h-4 w-4 text-cyan-100" aria-hidden />
									{item}
								</Link>
							))}
						</div>
					</section>
				</div>
			) : null}

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{ctas.map((cta) => {
					const Icon = cta.icon;

					return (
						<Link key={cta.href} href={cta.href} className="surface-panel group rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30">
							<div className="flex items-start justify-between gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-cyan-100">
									<Icon className="h-4 w-4" aria-hidden />
								</div>
								<ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-white" aria-hidden />
							</div>
							<h2 className="mt-5 font-semibold text-white">{cta.title}</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{cta.description}</p>
						</Link>
					);
				})}
			</section>

			<section className="surface-panel rounded-lg p-5">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-white">Ask the AI Chat Co-Pilot</h2>
						<p className="mt-1 text-sm text-muted-foreground">Try: “Is my money safe right now?” or “Are smart wallets exiting?”</p>
					</div>
					<Link href="/dashboard/copilot" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90">
						Open Co-Pilot
						<ArrowRight className="h-4 w-4" aria-hidden />
					</Link>
				</div>
			</section>
		</div>
	);
}
