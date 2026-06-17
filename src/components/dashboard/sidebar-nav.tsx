"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Radar,
  ShieldAlert,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/dashboard/stress-testing", label: "Stress Testing", icon: Gauge },
  { href: "/dashboard/risk-migration", label: "Panic / Outflow", icon: ShieldAlert },
  { href: "/dashboard/contagion", label: "Contagion", icon: GitBranch },
  { href: "/dashboard/smart-money", label: "Smart Money", icon: Radar },
  { href: "/dashboard/copilot", label: "AI Co-Pilot", icon: Bot },
  { href: "/dashboard/outputs", label: "Beautiful Outputs", icon: FileText }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-[#050713]/88 px-4 py-5 backdrop-blur-2xl lg:block">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
          <ShieldAlert className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-lg font-semibold text-white">Xentinel</span>
          <span className="block text-xs text-muted-foreground">Risk Co-Pilot</span>
        </span>
      </Link>

      <nav className="mt-10 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/7 hover:text-white",
                active && "border border-violet-300/20 bg-violet-400/12 text-white shadow-glow"
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]", active && "border-cyan-300/20 bg-cyan-300/10 text-cyan-100")}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
