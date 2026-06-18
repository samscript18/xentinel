import "server-only";
import { getWalletAnalysisWithXerberus } from "@/features/xerberus/services/xerberus-route-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SmartWalletModel } from "@/models/SmartWallet";
import type { RiskRating, SmartWallet } from "@/types/risk";

interface WatchlistEntry {
  walletAddress: string;
  label: string;
}

const defaultWatchlist: WatchlistEntry[] = [
  { label: "Alpha DeFi Wallet", walletAddress: "0x7a16ff8270133f063aab6c9977183d9e72835428" },
  { label: "Vault Rotation Wallet", walletAddress: "0x28C6c06298d514Db089934071355E5743bf21d60" },
  { label: "Blue-Chip Yield Wallet", walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "Stablecoin Liquidity Wallet", walletAddress: "0xF977814e90dA44bFA03b6295A0616a897441aceC" },
  { label: "Market Maker Watch", walletAddress: "0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0" },
  { label: "Risk-Off Treasury", walletAddress: "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb" },
  { label: "DeFi Whale Monitor", walletAddress: "0x3f5CE5FBFe3E9af3971dD833D26BA9b5C936f0bE" },
  { label: "Long-Horizon Holder", walletAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aec9B" },
  { label: "Protocol Exposure Watch", walletAddress: "0x00000000219ab540356cBB839Cbe05303d7705Fa" },
  { label: "Liquidity Rotation Watch", walletAddress: "0x06920C9fC643De77B99cB7670A944AD31eaAA260" }
];
const defaultWatchlistOrder = new Map(defaultWatchlist.map((entry, index) => [entry.walletAddress.toLowerCase(), index]));

function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function parseWatchlist(): WatchlistEntry[] {
  const raw = process.env.SMART_WALLET_WATCHLIST;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.flatMap((entry) => {
        if (typeof entry === "string") {
          return isEvmAddress(entry) ? [{ walletAddress: entry, label: entry }] : [];
        }

        if (typeof entry === "object" && entry !== null) {
          const record = entry as Record<string, unknown>;
          const walletAddress = typeof record.walletAddress === "string" ? record.walletAddress : undefined;
          const label = typeof record.label === "string" ? record.label : walletAddress;
          return walletAddress && isEvmAddress(walletAddress) ? [{ walletAddress, label: label ?? walletAddress }] : [];
        }

        return [];
      });
    }
  } catch {
    return raw.split(",").map((walletAddress) => walletAddress.trim()).filter(isEvmAddress).map((walletAddress) => ({
      walletAddress,
      label: walletAddress
    }));
  }

  return [];
}

function mergedWatchlist() {
  const seen = new Set<string>();

  return [...defaultWatchlist, ...parseWatchlist()].filter((entry) => {
    const key = entry.walletAddress.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function ensureWatchlist() {
  const entries = mergedWatchlist();

  if (entries.length === 0) {
    return;
  }

  await Promise.all(entries.map((entry) => SmartWalletModel.updateOne(
    { walletAddress: entry.walletAddress },
    { $set: { label: entry.label }, $setOnInsert: { walletAddress: entry.walletAddress } },
    { upsert: true }
  )));
}

function exposureChangePercent(current: number, previous: number) {
  if (previous <= 0) {
    return 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function riskScoreFromRating(rating: RiskRating) {
  const scores: Record<Exclude<RiskRating, "NR">, number> = {
    AAA: 8,
    AA: 18,
    A: 32,
    BBB: 55,
    BB: 78,
    B: 88,
    C: 96,
    D: 100
  };

  return rating === "NR" ? undefined : scores[rating];
}

function ratingFromScore(score: number): RiskRating {
  if (score >= 98) {
    return "C";
  }

  if (score >= 90) {
    return "B";
  }

  if (score >= 75) {
    return "BB";
  }

  if (score >= 55) {
    return "BBB";
  }

  if (score >= 35) {
    return "A";
  }

  if (score >= 20) {
    return "AA";
  }

  return "AAA";
}

function comparisonStatus(userRiskScore: number | undefined, smartMoneyAverageRiskScore: number) {
  if (userRiskScore === undefined || smartMoneyAverageRiskScore <= 0) {
    return "unavailable" as const;
  }

  if (userRiskScore <= smartMoneyAverageRiskScore - 5) {
    return "outperforming" as const;
  }

  if (userRiskScore >= smartMoneyAverageRiskScore + 5) {
    return "lagging" as const;
  }

  return "in_line" as const;
}

function comparisonSummary(status: ReturnType<typeof comparisonStatus>, userRiskScore: number | undefined, smartMoneyAverageRiskScore: number) {
  if (status === "outperforming") {
    return `Your portfolio risk is below the current smart-money average (${userRiskScore}/100 vs ${smartMoneyAverageRiskScore}/100).`;
  }

  if (status === "lagging") {
    return `Your portfolio risk is above the current smart-money average (${userRiskScore}/100 vs ${smartMoneyAverageRiskScore}/100).`;
  }

  if (status === "in_line") {
    return `Your portfolio risk is moving in line with the current smart-money average (${userRiskScore}/100 vs ${smartMoneyAverageRiskScore}/100).`;
  }

  return "Analyze a wallet to compare your portfolio against the current smart-money average.";
}

async function withSoftTimeout<TValue>(promise: Promise<TValue>, timeoutMs: number, fallback: TValue): Promise<TValue> {
  return Promise.race([
    promise,
    new Promise<TValue>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    })
  ]);
}

export async function addSmartWalletToWatchlist(input: WatchlistEntry) {
  const walletAddress = input.walletAddress.trim();
  const label = input.label.trim() || walletAddress;

  if (!isEvmAddress(walletAddress)) {
    throw new Error("Invalid wallet address.");
  }

  await connectToDatabase();
  await SmartWalletModel.updateOne(
    { walletAddress },
    { $set: { walletAddress, label } },
    { upsert: true }
  );
}

export async function getSmartMoneyLive(userWalletAddress?: string) {
  await connectToDatabase();
  await ensureWatchlist();

  const records = (await SmartWalletModel.find().lean())
    .filter((record) => isEvmAddress(record.walletAddress))
    .sort((left, right) => {
      const leftOrder = defaultWatchlistOrder.get(left.walletAddress.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = defaultWatchlistOrder.get(right.walletAddress.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });

  if (records.length === 0) {
    return {
      wallets: [] as SmartWallet[],
      comparison: {
        smartMoneyAverageRiskScore: 0,
        status: "unavailable" as const,
        summary: "Add smart wallets to start tracking risk posture."
      },
      source: "unavailable" as const,
      warnings: ["No smart-wallet watchlist is configured yet."]
    };
  }

  const userAnalysisPromise = userWalletAddress && isEvmAddress(userWalletAddress)
    ? withSoftTimeout(getWalletAnalysisWithXerberus(userWalletAddress).catch(() => undefined), 12_000, undefined)
    : Promise.resolve(undefined);
  let liveRefreshes = 0;
  const watchedRecords = records.slice(0, 12);
  const refreshSet = new Set<string>(watchedRecords.slice(0, 4).map((record) => record.walletAddress.toLowerCase()));
  if (userWalletAddress && isEvmAddress(userWalletAddress)) {
    refreshSet.add(userWalletAddress.toLowerCase());
  }
  const wallets = await Promise.all(watchedRecords.map(async (record) => {
    const shouldRefresh = refreshSet.has(record.walletAddress.toLowerCase());
    const analysis = shouldRefresh
      ? await withSoftTimeout(
        getWalletAnalysisWithXerberus(record.walletAddress).catch(() => undefined),
        12_000,
        undefined
      )
      : undefined;
    const previousRiskScore = numberFrom(record.currentRiskScore) ?? numberFrom(record.currentExposureUsd) ?? 0;
    const storedRating = typeof record.currentRiskRating === "string" ? record.currentRiskRating as RiskRating : "NR";
    const currentRiskRating = analysis?.source === "unavailable" ? storedRating : analysis?.data.rating ?? storedRating;
    const currentRiskScore = Math.round(
      (analysis?.source === "unavailable" ? undefined : analysis?.data.overallRiskScore)
      ?? riskScoreFromRating(currentRiskRating)
      ?? previousRiskScore
    );
    const change = exposureChangePercent(currentRiskScore, previousRiskScore);
    const recentMove = previousRiskScore > 0
      ? `${change >= 0 ? "Increased" : "Reduced"} wallet risk score by ${Math.abs(change)}% since the previous snapshot.`
      : "Baseline recorded. Changes will appear after the next scan.";
    const performanceScore = Math.max(0, Math.min(100, Math.round(100 - (currentRiskScore || 50))));

    if (analysis && analysis.source !== "unavailable" && currentRiskScore > 0) {
      liveRefreshes += 1;
    }

    await SmartWalletModel.updateOne(
      { walletAddress: record.walletAddress },
      {
        $set: {
          currentRiskRating,
          previousRiskScore,
          currentRiskScore,
          previousExposureUsd: previousRiskScore,
          currentExposureUsd: currentRiskScore,
          riskChangePercent: change,
          exposureChangePercent: change,
          allocationShift: recentMove,
          recentMove,
          confidence: previousRiskScore > 0 ? 0.75 : 0.35,
          performanceScore,
          holdings: [],
          lastMovementAt: new Date(),
          lastSyncedAt: new Date()
        }
      }
    );

    return {
      id: String(record._id),
      walletAddress: record.walletAddress,
      label: record.label,
      performanceScore,
      currentRiskScore,
      riskChangePercent: change,
      currentRiskRating,
      allocationShift: recentMove,
      lastMovementAt: new Date().toISOString(),
      recentMove,
      exposureChangePercent: change,
      confidence: previousRiskScore > 0 ? 0.75 : 0.35
    } satisfies SmartWallet;
  }));
  const scoredWallets = wallets.filter((wallet) => wallet.currentRiskScore > 0);
  const smartMoneyAverageRiskScore = scoredWallets.length > 0
    ? Math.round(scoredWallets.reduce((sum, wallet) => sum + wallet.currentRiskScore, 0) / scoredWallets.length)
    : 0;
  const userAnalysis = await userAnalysisPromise;
  const userRiskScore = userAnalysis?.source === "unavailable" ? undefined : userAnalysis?.data.overallRiskScore;
  const userRiskRating = userAnalysis?.source === "unavailable" ? undefined : userAnalysis?.data.rating;
  const status = comparisonStatus(userRiskScore, smartMoneyAverageRiskScore);
  const comparison = {
    userRiskScore,
    userRiskRating,
    smartMoneyAverageRiskScore,
    smartMoneyAverageRating: smartMoneyAverageRiskScore > 0 ? ratingFromScore(smartMoneyAverageRiskScore) : undefined,
    status,
    summary: comparisonSummary(status, userRiskScore, smartMoneyAverageRiskScore)
  };

  return {
    wallets,
    comparison,
    source: "mixed" as const,
    warnings: liveRefreshes > 0 ? [] as string[] : ["Smart-wallet snapshots are available, but live wallet refresh is still syncing."]
  };
}
