"use client";

import type { ReactNode } from "react";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ReactQueryProvider>
        <WalletProvider>{children}</WalletProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
