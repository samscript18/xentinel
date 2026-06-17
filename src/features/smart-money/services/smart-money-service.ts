import "server-only";
import { getWalletPortfolio } from "@/features/moralis/moralis-client";
import { xerberusService } from "@/features/xerberus/services/xerberus-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SmartWalletModel } from "@/models/SmartWallet";
import type { SmartWallet } from "@/types/risk";

interface WatchlistEntry {
  walletAddress: string;
  label: string;
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
          return [{ walletAddress: entry, label: entry }];
        }

        if (typeof entry === "object" && entry !== null) {
          const record = entry as Record<string, unknown>;
          const walletAddress = typeof record.walletAddress === "string" ? record.walletAddress : undefined;
          const label = typeof record.label === "string" ? record.label : walletAddress;
          return walletAddress ? [{ walletAddress, label: label ?? walletAddress }] : [];
        }

        return [];
      });
    }
  } catch {
    return raw.split(",").map((walletAddress) => walletAddress.trim()).filter(Boolean).map((walletAddress) => ({
      walletAddress,
      label: walletAddress
    }));
  }

  return [];
}

async function ensureWatchlist() {
  const entries = parseWatchlist();

  if (entries.length === 0) {
    return;
  }

  await Promise.all(entries.map((entry) => SmartWalletModel.updateOne(
    { walletAddress: entry.walletAddress },
    { $setOnInsert: entry },
    { upsert: true }
  )));
}

function exposureChangePercent(current: number, previous: number) {
  if (previous <= 0) {
    return 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function getSmartMoneyLive() {
  await connectToDatabase();
  await ensureWatchlist();

  const records = await SmartWalletModel.find().lean();

  if (records.length === 0) {
    return {
      wallets: [] as SmartWallet[],
      source: "unavailable" as const,
      warnings: ["No smart-wallet watchlist is configured yet."]
    };
  }

  const wallets = await Promise.all(records.map(async (record) => {
    const portfolio = await getWalletPortfolio(record.walletAddress);
    const rating = await xerberusService.rateEntity({ walletAddress: record.walletAddress }).catch(() => undefined);
    const currentExposureUsd = Math.round(portfolio.totalValueUsd);
    const previousExposureUsd = typeof record.currentExposureUsd === "number" ? record.currentExposureUsd : 0;
    const change = exposureChangePercent(currentExposureUsd, previousExposureUsd);
    const currentRiskRating = rating?.data.rating ?? "NR";
    const recentMove = previousExposureUsd > 0
      ? `${change >= 0 ? "Increased" : "Reduced"} total tracked exposure by ${Math.abs(change)}% since the previous snapshot.`
      : "Initial live exposure snapshot recorded.";

    await SmartWalletModel.updateOne(
      { walletAddress: record.walletAddress },
      {
        $set: {
          currentRiskRating,
          previousExposureUsd,
          currentExposureUsd,
          exposureChangePercent: change,
          allocationShift: recentMove,
          recentMove,
          confidence: previousExposureUsd > 0 ? 0.75 : 0.35,
          performanceScore: Math.max(0, Math.min(100, Math.round(100 - (rating?.data.score ?? 50)))),
          holdings: portfolio.defiPositions.map((position) => ({
            label: position.protocolName,
            valueUsd: position.valueUsd,
            category: position.category
          })),
          lastMovementAt: new Date(),
          lastSyncedAt: new Date()
        }
      }
    );

    return {
      id: String(record._id),
      walletAddress: record.walletAddress,
      label: record.label,
      performanceScore: Math.max(0, Math.min(100, Math.round(100 - (rating?.data.score ?? 50)))),
      currentRiskRating,
      allocationShift: recentMove,
      lastMovementAt: new Date().toISOString(),
      recentMove,
      exposureChangePercent: change,
      confidence: previousExposureUsd > 0 ? 0.75 : 0.35
    } satisfies SmartWallet;
  }));

  return {
    wallets,
    source: "mixed" as const,
    warnings: [] as string[]
  };
}
