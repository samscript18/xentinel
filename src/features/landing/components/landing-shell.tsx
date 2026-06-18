"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Bot, ChevronRight, CircleAlert, FileText, Gauge, GitBranch, Menu, Network, Radar, ShieldAlert, ShieldCheck, Sparkles, Target, TrendingDown, WalletCards, X } from "lucide-react";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { cn } from "@/lib/utils/cn";

const problemCards = [
	{
		title: "Protocol risk is hard to understand",
		description: "A position can look healthy until ratings, liquidity, collateral quality, and dependency pressure are viewed together.",
		icon: ShieldAlert,
	},
	{
		title: "Smart money exits first",
		description: "High-performing wallets often rotate out before the average user sees a headline, downgrade, or liquidity shock.",
		icon: TrendingDown,
	},
	{
		title: "Dependencies hide contagion",
		description: "A DeFi position can inherit risk through shared liquidity, stablecoins, restaking collateral, and vault dependencies.",
		icon: GitBranch,
	},
	{
		title: "Dashboards rarely tell you what to do",
		description: "Raw data is not enough. Users need a clear early-warning layer that explains what changed and why it matters.",
		icon: Target,
	},
];

const solutionPillars = [
	{
		title: "Portfolio Guardian",
		description: "See what deserves attention first: wallet rating, risk score, intrinsic risk, systemic risk, and position context when available.",
		metric: "Ready",
		label: "Current risk",
	},
	{
		title: "Stress Testing Engine",
		description: "Shows what happens if ETH drops, USDC depegs, exit liquidity thins, or liquidation buffers compress.",
		metric: "78",
		label: "Panic meter",
	},
	{
		title: "Panic / Outflow Detector",
		description: "Turns rating changes, exit pressure, and smart-wallet movement into an early-warning view.",
		metric: "Tracked",
		label: "Panic probability",
	},
	{
		title: "AI Chat Co-Pilot",
		description: "Answers daily risk questions: is my money safe, is panic building, and what should I watch?",
		metric: "5",
		label: "Context feeds",
	},
];

const workflowSteps = ["Paste wallet", "Analyze portfolio", "Stress test positions", "Compare smart money", "Detect panic signals", "Ask the AI Co-Pilot"];

const riskEngineItems = ["AAA-D ratings", "Intrinsic risk", "Systemic risk", "Protocol dependency analysis", "Vault and position stress awareness", "Contagion intelligence"];

const featureCards = [
	["Portfolio Guardian", WalletCards],
	["Stress Testing Engine", Gauge],
	["Smart Money Sentinel", Radar],
	["Panic / Outflow Detector", TrendingDown],
	["AI Chat Co-Pilot", Bot],
	["Beautiful Outputs", FileText],
	["Intrinsic vs systemic risk", ShieldCheck],
	["Dependency mapping", GitBranch],
	["Contagion scenarios", Network],
	["Risk engine", Sparkles],
] as const;

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 26 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<motion.div variants={fadeUp} whileHover={{ y: -6, transition: { duration: 0.22 } }} className={className}>
			{children}
		</motion.div>
	);
}

function LandingSection({ eyebrow, title, description, children, className, id }: { eyebrow: string; title: string; description: string; children: React.ReactNode; className?: string; id?: string }) {
	return (
		<motion.section
			id={id}
			variants={stagger}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true, amount: 0.18 }}
			className={cn("scroll-mt-28 mx-auto w-full max-w-7xl px-4 py-20 md:px-8", className)}
		>
			<motion.div variants={fadeUp} className="mb-10 max-w-3xl">
				<p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</p>
				<h2 className="text-3xl font-semibold tracking-normal text-white md:text-4xl">{title}</h2>
				<p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
			</motion.div>
			{children}
		</motion.section>
	);
}

function CtaLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
	return (
		<Link
			href={href}
			className={cn(
				"inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
				variant === "primary" ? "border-violet-300/25 bg-primary text-white shadow-glow hover:bg-primary/90" : "border-white/10 bg-white/[0.045] text-white hover:border-cyan-300/30 hover:bg-white/[0.07]",
			)}
		>
			{children}
		</Link>
	);
}

function LandingNavbar() {
	const [open, setOpen] = useState(false);
	const links = [
		{ href: "#features", label: "Features" },
		{ href: "#how-it-works", label: "How it works" },
		{ href: "#risk-engine", label: "Risk engine" },
	];

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050713]/75 backdrop-blur-2xl">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
				<Link href="/" className="flex items-center gap-3">
					<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-glow">
						<ShieldAlert className="h-4 w-4" aria-hidden />
					</span>
					<span>
						<span className="block text-sm font-semibold text-white">Xentinel</span>
						<span className="block text-[11px] uppercase tracking-[0.18em] text-cyan-100">Risk Co-Pilot</span>
					</span>
				</Link>

				<div className="hidden items-center gap-8 md:flex">
					{links.map((link) => (
						<a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition hover:text-white">
							{link.label}
						</a>
					))}
				</div>

				<div className="hidden md:block">
					<CtaLink href="/dashboard">
						Launch App <ArrowRight className="h-4 w-4" aria-hidden />
					</CtaLink>
				</div>

				<button
					className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white md:hidden"
					onClick={() => setOpen((current) => !current)}
					aria-label="Toggle navigation"
				>
					{open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
				</button>
			</nav>

			{open ? (
				<div className="border-t border-white/10 bg-[#050713]/95 px-4 py-4 md:hidden">
					<div className="grid gap-2">
						{links.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-white"
								onClick={() => setOpen(false)}
							>
								{link.label}
							</a>
						))}
						<Link
							href="/dashboard"
							className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-glow"
							onClick={() => setOpen(false)}
						>
							Launch App
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Link>
					</div>
				</div>
			) : null}
		</header>
	);
}

function HeroPreview() {
	return (
		<motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative">
			<motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-8 -bottom-24 hidden rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 shadow-glow backdrop-blur-xl lg:block">
				<p className="text-xs text-red-100">Panic alert</p>
				<p className="mt-1 text-sm font-semibold text-white">Rating drift detected</p>
			</motion.div>
			<motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-4 -bottom-24 hidden rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 shadow-cyan backdrop-blur-xl lg:block">
				<p className="text-xs text-cyan-100">Smart money signal</p>
				<p className="mt-1 text-sm font-semibold text-white">Exposure change tracked</p>
			</motion.div>

			<motion.div whileHover={{ y: -6, rotateX: 1, rotateY: -1 }} transition={{ duration: 0.25 }} className="rounded-3xl border border-white/10 bg-white/[0.045] p-3 shadow-glow backdrop-blur-xl">
				<div className="rounded-2xl border border-white/10 bg-[#070b18]/95 p-5">
					<div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Xentinel console</p>
							<h3 className="mt-2 text-xl font-semibold text-white">Wallet Risk Command</h3>
						</div>
						<RiskBadge rating="NR" />
					</div>

					<div className="mt-5 grid gap-3 md:grid-cols-3">
						{[
							["Overall risk", "Ready", "text-violet-100"],
							["Systemic", "On demand", "text-amber-100"],
							["Contagion", "Mapped", "text-red-100"],
						].map(([label, value, color]) => (
							<div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
								<p className="text-xs text-muted-foreground">{label}</p>
								<p className={cn("mt-3 text-2xl font-semibold", color)}>{value}</p>
							</div>
						))}
					</div>

					<div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
						<div className="flex items-start gap-3">
							<CircleAlert className="mt-1 h-4 w-4 shrink-0 text-amber-100" aria-hidden />
							<div>
								<p className="text-sm font-semibold text-white">Panic / outflow alert</p>
								<p className="mt-1 text-sm leading-6 text-amber-50/75">Wallet risk signals update from available ratings, stress outputs, and configured smart-wallet snapshots.</p>
							</div>
						</div>
					</div>

					<div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
						<p className="text-sm font-semibold text-white">Contagion path preview</p>
						<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							{["Protocol", "Dependency", "Position", "Your Wallet"].map((item, index) => (
								<div key={item} className="flex items-center gap-2">
									<span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100">{item}</span>
									{index < 3 ? <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
								</div>
							))}
						</div>
					</div>

					<div className="mt-5 grid gap-3 md:grid-cols-2">
						<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
							<p className="text-xs text-muted-foreground">Smart money exit</p>
							<p className="mt-2 text-lg font-semibold text-white">Alpha Vault trims yield</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
							<p className="text-xs text-muted-foreground">AI Co-Pilot insight</p>
							<p className="mt-2 text-lg font-semibold text-white">Watch the top live risk</p>
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

function HeroSection() {
	return (
		<section className="relative overflow-hidden">
			<div className="absolute inset-0 " />
			<div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
			<div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-4 py-28 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
				<motion.div variants={stagger} initial="hidden" animate="show">
					<Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-white backdrop-blur-xl">
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-glow">
							<ShieldAlert className="h-4 w-4" aria-hidden />
						</span>
						Xentinel
					</Link>
					<motion.p variants={fadeUp} className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Know your risk. Watch the smart money. Stay ahead of the panic.</motion.p>
					<motion.h1 variants={fadeUp} className="mt-5 max-w-4xl text-5xl font-semibold tracking-normal text-white md:text-6xl xl:text-[4rem]">AI-powered DeFi risk Co-Pilot and Smart Money Sentinel.</motion.h1>
					<motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
						Xentinel combines risk ratings, stress testing, smart-money behavior, and panic/outflow detection to answer the questions users actually ask: is my money safe, are smart wallets exiting, and
						what should I pay attention to?
					</motion.p>
					<motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
						<CtaLink href="/dashboard">
							Launch App <ArrowRight className="h-4 w-4" aria-hidden />
						</CtaLink>
						<CtaLink href="/dashboard/portfolio" variant="secondary">
							Explore Portfolio Guardian
						</CtaLink>
					</motion.div>
				</motion.div>
				<HeroPreview />
			</div>
		</section>
	);
}

function ProblemSection() {
	return (
		<LandingSection
			eyebrow="The problem"
			title="Most DeFi users discover risk too late."
			description="Risk does not announce itself as a neat dashboard metric. It moves through ratings, liquidity, dependencies, and elite wallet behavior before the average user reacts."
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{problemCards.map((card) => {
					const Icon = card.icon;

					return (
						<MotionCard key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-cyan-300/30">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100">
								<Icon className="h-5 w-5" aria-hidden />
							</div>
							<h3 className="mt-6 text-lg font-semibold text-white">{card.title}</h3>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
						</MotionCard>
					);
				})}
			</div>
		</LandingSection>
	);
}

function SolutionSection() {
	return (
		<LandingSection
			eyebrow="The solution"
			title="From raw risk data to early-warning intelligence."
			description="Xentinel turns risk signals into a daily-usable DeFi shield: what is exposed, what breaks under stress, whether panic is building, and which signal deserves attention first."
		>
			<div className="grid gap-5 lg:grid-cols-3">
				{solutionPillars.map((pillar) => (
					<MotionCard key={pillar.title} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-6 shadow-glow backdrop-blur-xl">
						<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
							<p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{pillar.label}</p>
							<p className="mt-3 text-3xl font-semibold text-white">{pillar.metric}</p>
						</div>
						<h3 className="mt-6 text-xl font-semibold text-white">{pillar.title}</h3>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
					</MotionCard>
				))}
			</div>
		</LandingSection>
	);
}

function HowItWorksSection() {
	return (
		<LandingSection
			eyebrow="How it works"
			title="From wallet input to actionable risk insight."
			description="Paste a wallet, understand the risk profile, stress test positions, compare smart money, detect panic pressure, then ask the AI Co-Pilot what to watch next."
			id="how-it-works"
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
				{workflowSteps.map((step, index) => (
					<MotionCard key={step} className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-white shadow-glow">{index + 1}</div>
						<p className="mt-6 text-lg font-semibold text-white">{step}</p>
						{index < workflowSteps.length - 1 ? <ArrowRight className="absolute right-5 top-9 hidden h-5 w-5 text-cyan-100 lg:block" aria-hidden /> : null}
					</MotionCard>
				))}
			</div>
		</LandingSection>
	);
}

function RiskEngineSection() {
	return (
		<LandingSection
			eyebrow="Risk engine"
			title="Why the risk engine matters."
			description="Xentinel is built around Xerberus risk intelligence so users can move beyond balances and see how risk spreads across DeFi."
			id="risk-engine"
		>
			<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
				<motion.div variants={fadeUp} className="rounded-3xl border border-violet-300/20 bg-violet-400/10 p-7 shadow-glow">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-100">Risk intelligence layer</p>
					<h3 className="mt-4 text-2xl font-semibold text-white">Designed for decisions, not raw data.</h3>
					<p className="mt-4 text-sm leading-7 text-violet-50/75">
						Xerberus gives Xentinel the primitives DeFi risk needs: ratings, intrinsic risk, systemic risk, stress context, and dependency awareness. Xentinel turns them into a user-facing daily risk workflow.
					</p>
				</motion.div>
				<div className="grid gap-3 sm:grid-cols-2">
					{riskEngineItems.map((item) => (
						<MotionCard key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium text-white">
							<span className="mr-2 text-cyan-200">•</span>
							{item}
						</MotionCard>
					))}
				</div>
			</div>
		</LandingSection>
	);
}

function StressTestingSection() {
	return (
		<LandingSection
			eyebrow="Stress Testing Engine"
			title="What happens if the market breaks?"
			description="Xentinel turns scary market questions into readable stress outputs: how quickly positions can exit, where liquidity thins, and what deserves attention before panic starts."
		>
			<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
				<motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
					<h3 className="text-xl font-semibold text-white">Stress scenarios</h3>
					<div className="mt-6 grid gap-4">
						{[
							["What if ETH drops 40%?", "Scenario", "Drawdown and systemic pressure come from the stress engine when available."],
							["What if USDC depegs?", "Scenario", "Stablecoin pressure is evaluated against the current wallet when supported."],
							["What if exits crowd?", "Exit ladder", "Exit timing and crowding come from available ladder analysis."],
						].map(([title, metric, detail]) => (
							<MotionCard key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="font-semibold text-white">{title}</p>
								<p className="mt-2 text-xl font-semibold text-amber-100">{metric}</p>
								<p className="mt-1 text-sm text-muted-foreground">{detail}</p>
							</MotionCard>
						))}
					</div>
				</motion.div>
				<motion.div variants={fadeUp} className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-7">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Exit liquidity ladder</p>
					<h3 className="mt-4 text-2xl font-semibold text-white">Downside is also about timing.</h3>
					<p className="mt-4 text-sm leading-7 text-amber-50/75">
						The first hour may be manageable. By 6-18 hours, slippage and crowding can become the real risk. The Stress Testing Engine makes that visible before panic starts.
					</p>
					<div className="mt-6 space-y-3">
						{["0-1h: live exit depth", "1-6h: live slippage window", "6-18h: live crowding queue"].map((item) => (
							<MotionCard key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-amber-50/80">
								{item}
							</MotionCard>
						))}
					</div>
				</motion.div>
			</div>
		</LandingSection>
	);
}

function PanicOutflowSection() {
	return (
		<LandingSection
			eyebrow="Flagship feature"
			title="Panic / Outflow Detector"
			description="Instead of only asking what is risky now, Xentinel asks whether panic is building, whether experienced wallets are rotating, and whether stress is accelerating."
		>
			<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
				<motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
					<h3 className="text-xl font-semibold text-white">Panic sequence</h3>
					<div className="mt-6 space-y-4">
						{[
							["Rating drift", "Prior", "Current"],
							["Smart wallet exposure", "Prior", "Current"],
							["Dependency stress", "Prior", "Current"],
							["Panic probability", "Prior", "Current"],
						].map(([label, from, to]) => (
							<MotionCard key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-sm text-muted-foreground">{label}</p>
								<div className="mt-3 flex items-center gap-3 text-lg font-semibold text-white">
									<span>{from}</span>
									<ArrowRight className="h-4 w-4 text-cyan-100" aria-hidden />
									<span className="text-amber-100">{to}</span>
								</div>
							</MotionCard>
						))}
					</div>
				</motion.div>
				<motion.div variants={fadeUp} className="rounded-3xl border border-red-300/20 bg-red-400/10 p-7">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-100">Early warning</p>
					<h3 className="mt-4 text-2xl font-semibold text-white">Xentinel connects the signals before they become obvious.</h3>
					<p className="mt-4 text-sm leading-7 text-red-50/75">
						A rating change alone is useful. A rating change paired with smart-wallet exits, outflow pressure, dependency stress, and rising panic probability becomes an actionable alert.
					</p>
					<div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
						<motion.div initial={{ width: 0 }} whileInView={{ width: "62%" }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-400" />
					</div>
					<p className="mt-2 text-sm text-red-50/75">Panic score after available signals are analyzed</p>
				</motion.div>
			</div>
		</LandingSection>
	);
}

function ContagionSection() {
	return (
		<LandingSection eyebrow="Contagion radar" title="DeFi risk travels through dependencies." description="Xentinel maps hidden exposure chains so users can understand how a failure in one protocol may affect another.">
			<motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
				<div className="flex flex-wrap items-center gap-3">
					{["Protocol", "Dependency", "Position", "Your Wallet"].map((node, index) => (
						<motion.div key={node} variants={fadeUp} className="flex items-center gap-3">
							<div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-semibold text-cyan-50">{node}</div>
							{index < 3 ? <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden /> : null}
						</motion.div>
					))}
				</div>
				<div className="mt-8 grid gap-4 md:grid-cols-3">
					{["Shared liquidity", "Yield market depth", "Direct wallet exposure"].map((item) => (
						<MotionCard key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
							<p className="font-semibold text-white">{item}</p>
							<p className="mt-2 leading-6">A dependency that can amplify risk into the next connected position.</p>
						</MotionCard>
					))}
				</div>
			</motion.div>
		</LandingSection>
	);
}

function SmartMoneySection() {
	return (
		<LandingSection
			eyebrow="Smart Money Sentinel"
			title="Compare your risk profile against high-performing wallets."
			description="Smart wallets are not always right, but coordinated rotations are useful signals. Xentinel compares your risk profile against a watchlist so you can see whether you are ahead, behind, or moving in line."
		>
			<div className="grid gap-5 lg:grid-cols-3">
				{[
					["Smart wallets reducing exposure", "Tracked from snapshots", "text-red-100"],
					["Risk-off rotations", "Measured from snapshots", "text-amber-100"],
					["Safer vault rotation", "Compared when available", "text-emerald-100"],
				].map(([title, value, color]) => (
					<MotionCard key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
						<p className="text-sm text-muted-foreground">{title}</p>
						<p className={cn("mt-4 text-2xl font-semibold", color)}>{value}</p>
					</MotionCard>
				))}
			</div>
		</LandingSection>
	);
}

function CopilotSection() {
	return (
		<LandingSection
			eyebrow="AI Chat Co-Pilot"
			title="Risk explanations that sound like an analyst, not a data dump."
			description="The Co-Pilot lets users ask natural questions and receive portfolio-aware risk explanations grounded in available risk context."
		>
			<div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
				<div className="grid gap-3">
					{["Is my money safe right now?", "What happens if a dependency breaks?", "Are smart wallets exiting anything?", "What should I pay attention to?"].map((question) => (
							<MotionCard key={question} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white">
								{question}
							</MotionCard>
						))}
				</div>
				<motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-[#070b18]/90 p-5 shadow-glow">
					<div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">Xentinel AI Co-Pilot</p>
						<p className="mt-3 text-sm leading-7 text-violet-50/80">
							Xentinel answers with available wallet context: ratings, stress scenarios, panic signals, smart-wallet movement, and dependency paths.
						</p>
					</div>
				</motion.div>
			</div>
		</LandingSection>
	);
}

function BeautifulOutputsSection() {
	return (
		<LandingSection eyebrow="Beautiful Outputs" title="Risk intelligence should be easy to share." description="Polished output surfaces turn risk state, stress results, and alerts into shareable briefs.">
			<div className="grid gap-5 md:grid-cols-3">
				{[
					["Risk report", "A clean export surface for wallet risk state, stress results, and top attention items when report generation is available."],
					["Risk chart visuals", "Premium rating, systemic risk, and stress visuals built around available portfolio risk signals."],
					["Rating-drift alerts", "Beautiful alert cards for AAA-D movement, outflow pressure, and panic changes when watch data exists."],
				].map(([title, description]) => (
					<MotionCard key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
						<FileText className="h-5 w-5 text-cyan-100" aria-hidden />
						<h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
					</MotionCard>
				))}
			</div>
			<div className="mt-8">
				<CtaLink href="/dashboard/outputs" variant="secondary">
					Open Beautiful Outputs
				</CtaLink>
			</div>
		</LandingSection>
	);
}

function FeatureGridSection() {
	return (
		<LandingSection eyebrow="Feature grid" title="A complete risk intelligence surface." description="Every module is shaped around the daily questions users ask before allocating, rotating, or exiting positions." id="features">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{featureCards.map(([label, Icon]) => (
					<MotionCard key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-violet-300/30">
						<Icon className="h-5 w-5 text-cyan-100" aria-hidden />
						<p className="mt-5 text-sm font-semibold text-white">{label}</p>
					</MotionCard>
				))}
			</div>
		</LandingSection>
	);
}

function FinalCtaSection() {
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8">
			<motion.div
				initial={{ opacity: 0, y: 24, scale: 0.98 }}
				whileInView={{ opacity: 1, y: 0, scale: 1 }}
				viewport={{ once: true, amount: 0.25 }}
				transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
				className="overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/18 via-white/[0.04] to-cyan-400/12 p-8 shadow-glow md:p-12"
			>
				<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Production-ready flow</p>
				<h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-white md:text-5xl">See Xentinel in action.</h2>
				<p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
					Launch the command center or open Portfolio Guardian to move from wallet input to portfolio analysis, stress tests, smart money comparison, panic signals, and AI Co-Pilot guidance.
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<CtaLink href="/dashboard">
						Launch App <ArrowRight className="h-4 w-4" aria-hidden />
					</CtaLink>
					<CtaLink href="/dashboard/portfolio" variant="secondary">
						Open Portfolio Guardian
					</CtaLink>
				</div>
			</motion.div>
		</section>
	);
}

function LandingFooter() {
	return (
		<footer className="border-t border-white/10 px-4 py-10 md:px-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
				<div>
					<p className="font-semibold text-white">Xentinel</p>
					<p className="mt-1">Built for the Vibe Buildathon DeFi Track.</p>
				</div>
				<div className="text-left md:text-right">
					<p>Designed for Xerberus-powered DeFi risk intelligence.</p>
					<p className="mt-1">Not financial advice.</p>
				</div>
			</div>
		</footer>
	);
}

export function LandingShell() {
	return (
		<main className="min-h-screen overflow-hidden scroll-smooth">
			<LandingNavbar />
			<HeroSection />
			<ProblemSection />
			<SolutionSection />
			<HowItWorksSection />
			<RiskEngineSection />
			<StressTestingSection />
			<PanicOutflowSection />
			<ContagionSection />
			<SmartMoneySection />
			<CopilotSection />
			<BeautifulOutputsSection />
			<FeatureGridSection />
			<FinalCtaSection />
			<LandingFooter />
		</main>
	);
}
