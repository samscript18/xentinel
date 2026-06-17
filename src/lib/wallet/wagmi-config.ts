"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrum, base, mainnet, optimism, polygon } from "wagmi/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "xentinel-local";
const appUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const wagmiConfig = getDefaultConfig({
  appName: "Xentinel",
  appDescription: "AI-powered DeFi risk co-pilot and smart money sentinel.",
  appUrl: appUrl,
  projectId: walletConnectProjectId,
  chains: [mainnet, arbitrum, base, optimism, polygon],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http()
  }
});
