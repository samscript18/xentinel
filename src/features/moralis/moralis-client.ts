import "server-only";
import { getMoralisConfig } from "@/features/moralis/config";
import type { MoralisDefiPosition, MoralisPortfolio, MoralisTokenHolding } from "@/features/moralis/types";

class MoralisClientError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "MoralisClientError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

async function moralisGet(baseUrl: string, path: string, searchParams: URLSearchParams) {
  const config = getMoralisConfig();

  if (!config.isConfigured || !config.apiKey) {
    throw new MoralisClientError("Moralis is not configured.");
  }

  const url = `${baseUrl.replace(/\/$/, "")}${path}?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": config.apiKey,
      "X-Api-Key": config.apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new MoralisClientError("Moralis request failed.", response.status);
  }

  return response.json() as Promise<unknown>;
}

function tokenHoldingsFrom(chain: string, payload: unknown): MoralisTokenHolding[] {
  const results = isRecord(payload) && Array.isArray(payload.result) ? payload.result : [];

  return results
    .filter(isRecord)
    .map((token) => ({
      chain,
      tokenAddress: stringFrom(token.token_address),
      name: stringFrom(token.name) ?? stringFrom(token.symbol) ?? "Unknown token",
      symbol: stringFrom(token.symbol) ?? "UNKNOWN",
      balanceFormatted: stringFrom(token.balance_formatted),
      usdPrice: numberFrom(token.usd_price),
      usdValue: numberFrom(token.usd_value) ?? 0,
      portfolioPercentage: numberFrom(token.portfolio_percentage) ?? 0,
      nativeToken: token.native_token === true
    }))
    .filter((token) => token.usdValue > 0);
}

function categoryFrom(details: unknown): MoralisDefiPosition["category"] {
  if (!isRecord(details)) {
    return "defi";
  }

  if (details.isDebt === true) {
    return "debt";
  }

  if (isRecord(details.lending)) {
    return "lending";
  }

  if (isRecord(details.liquidity)) {
    return "liquidity";
  }

  if (isRecord(details.staking)) {
    return "staking";
  }

  return "defi";
}

function defiPositionsFrom(payload: unknown): MoralisDefiPosition[] {
  const results = isRecord(payload) && Array.isArray(payload.result) ? payload.result : [];

  return results.filter(isRecord).map((item) => {
    const position = isRecord(item.position) ? item.position : {};
    const tokens = Array.isArray(position.tokens) ? position.tokens.filter(isRecord) : [];
    const tokenSymbols = tokens.map((token) => stringFrom(token.symbol)).filter((symbol): symbol is string => Boolean(symbol));
    const tokenAddresses = tokens.map((token) => stringFrom(token.address)).filter((address): address is string => Boolean(address));
    const valueUsd = numberFrom(position.balanceUsd) ?? tokens.reduce((sum, token) => sum + (numberFrom(token.usdValue) ?? 0), 0);

    return {
      chain: stringFrom(item.chainId) ?? "unknown",
      protocolId: stringFrom(item.protocolId),
      protocolName: stringFrom(item.protocolName) ?? "Unknown protocol",
      protocolUrl: stringFrom(item.protocolUrl),
      positionAddress: stringFrom(position.address),
      asset: tokenSymbols.length > 0 ? tokenSymbols.join(" / ") : "DeFi position",
      valueUsd,
      unclaimedUsd: numberFrom(position.unclaimedUsd) ?? 0,
      tokenAddresses,
      tokenSymbols,
      category: categoryFrom(position.details)
    };
  }).filter((position) => position.valueUsd > 0);
}

export async function getWalletPortfolio(walletAddress: string): Promise<MoralisPortfolio> {
  const config = getMoralisConfig();
  const tokenResults = await Promise.allSettled(config.chains.map(async (chain) => {
    const payload = await moralisGet(config.dataApiBaseUrl, `/wallets/${walletAddress}/tokens`, new URLSearchParams({
      chain,
      exclude_spam: "true",
      exclude_unverified_contracts: "true"
    }));

    return tokenHoldingsFrom(chain, payload);
  }));
  const defiPayload = await moralisGet(config.universalApiBaseUrl, `/wallets/${walletAddress}/defi/positions`, new URLSearchParams({
    chains: "mainnets",
    limit: "100"
  }));
  const tokenHoldings = tokenResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const defiPositions = defiPositionsFrom(defiPayload);
  const totalTokenValueUsd = tokenHoldings.reduce((sum, token) => sum + token.usdValue, 0);
  const totalDefiValueUsd = defiPositions.reduce((sum, position) => sum + position.valueUsd, 0);

  return {
    walletAddress,
    tokenHoldings,
    defiPositions,
    totalTokenValueUsd,
    totalDefiValueUsd,
    totalValueUsd: totalTokenValueUsd + totalDefiValueUsd,
    syncedAt: new Date().toISOString()
  };
}
