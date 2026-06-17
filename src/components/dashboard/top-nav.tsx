import { Search, ShieldCheck } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

export function TopNav() {
	return (
		<header className="sticky top-0 z-20 border-b border-white/10 bg-[#050713]/78 px-4 py-3 backdrop-blur-2xl md:px-8">
			<div className="flex items-center justify-between gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 shadow-cyan">
						<ShieldCheck className="h-4 w-4" aria-hidden />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-white">Risk Console</p>
						<p className="truncate text-xs text-muted-foreground">Daily DeFi protection layer</p>
					</div>
				</div>
				<div className="hidden w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-muted-foreground md:flex">
					<Search className="h-4 w-4" aria-hidden />
					Search wallets, protocols, signals
				</div>
				<div className="flex items-center gap-2">
					<WalletConnectButton />
				</div>
			</div>
		</header>
	);
}
