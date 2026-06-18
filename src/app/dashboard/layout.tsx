import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Risk Command Center",
  description: "Portfolio Guardian, Stress Testing Engine, Smart Money Sentinel, Panic / Outflow Detector, Contagion Radar, AI Chat Co-Pilot, and Beautiful Outputs.",
  openGraph: {
    title: "Xentinel Risk Command Center",
    description: "A premium DeFi risk intelligence workspace for wallet analysis, stress testing, panic signals, smart money comparison, and AI guidance.",
    url: "/dashboard"
  },
  twitter: {
    card: "summary_large_image",
    title: "Xentinel Risk Command Center",
    description: "Know your risk. Watch the smart money. Stay ahead of the panic."
  }
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
