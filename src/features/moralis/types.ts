export interface MoralisConfig {
  isConfigured: boolean;
  apiKey?: string;
  dataApiBaseUrl: string;
  universalApiBaseUrl: string;
  chains: string[];
}

export interface MoralisTokenHolding {
  chain: string;
  tokenAddress?: string;
  name: string;
  symbol: string;
  balanceFormatted?: string;
  usdPrice?: number;
  usdValue: number;
  portfolioPercentage: number;
  nativeToken: boolean;
}

export interface MoralisDefiPosition {
  chain: string;
  protocolId?: string;
  protocolName: string;
  protocolUrl?: string;
  positionAddress?: string;
  asset: string;
  valueUsd: number;
  unclaimedUsd: number;
  tokenAddresses: string[];
  tokenSymbols: string[];
  category: "lending" | "liquidity" | "staking" | "debt" | "defi";
}

export interface MoralisPortfolio {
  walletAddress: string;
  tokenHoldings: MoralisTokenHolding[];
  defiPositions: MoralisDefiPosition[];
  totalTokenValueUsd: number;
  totalDefiValueUsd: number;
  totalValueUsd: number;
  syncedAt: string;
}
