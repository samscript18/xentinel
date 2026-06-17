import "server-only";
import type { MoralisConfig } from "@/features/moralis/types";

const defaultChains = ["eth", "base", "arbitrum", "optimism", "polygon"];

export function getMoralisConfig(): MoralisConfig {
  const chains = process.env.MORALIS_CHAINS?.split(",").map((chain) => chain.trim()).filter(Boolean) ?? defaultChains;

  return {
    isConfigured: Boolean(process.env.MORALIS_API_KEY),
    apiKey: process.env.MORALIS_API_KEY,
    dataApiBaseUrl: process.env.MORALIS_DATA_API_BASE_URL ?? "https://deep-index.moralis.io/api/v2.2",
    universalApiBaseUrl: process.env.MORALIS_UNIVERSAL_API_BASE_URL ?? "https://api.moralis.com/v1",
    chains
  };
}
