import type { ReactNode } from "react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { TopNav } from "@/components/dashboard/top-nav";
import { DashboardMotion } from "@/components/motion/dashboard-motion";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.12),transparent_28rem),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.09),transparent_26rem)]">
      <SidebarNav />
      <div className="min-w-0 lg:pl-72">
        <TopNav />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-8 pb-24 md:px-8 lg:pb-8">
          <DashboardMotion>{children}</DashboardMotion>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
