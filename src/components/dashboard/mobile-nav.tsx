"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, Gauge, GitBranch, LayoutDashboard, Radar, ShieldAlert, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/portfolio", label: "Guard", icon: WalletCards },
  { href: "/dashboard/stress-testing", label: "Stress", icon: Gauge },
  { href: "/dashboard/risk-migration", label: "Panic", icon: ShieldAlert },
  { href: "/dashboard/contagion", label: "Map", icon: GitBranch },
  { href: "/dashboard/smart-money", label: "Smart", icon: Radar },
  { href: "/dashboard/copilot", label: "AI", icon: Bot },
  { href: "/dashboard/outputs", label: "Output", icon: FileText }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050713]/95 px-2 py-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-muted-foreground transition hover:bg-white/[0.06] hover:text-white",
                active && "border border-violet-300/20 bg-violet-400/12 text-white shadow-glow"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
