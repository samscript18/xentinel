import { NextResponse, type NextRequest } from "next/server";
import { addSmartWalletToWatchlist, getSmartMoneyLive } from "@/features/smart-money/services/smart-money-service";
import type { SmartMoneyResponse } from "@/types/api";

interface AddSmartWalletRequest {
  walletAddress?: string;
  label?: string;
}

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? undefined;
  const result = await getSmartMoneyLive(walletAddress).catch((error) => {
    console.warn("[smart-money]", error instanceof Error ? error.message : "Unknown smart-money error");
    return {
      wallets: [],
      comparison: {
        smartMoneyAverageRiskScore: 0,
        status: "unavailable" as const,
        summary: "Smart-money intelligence is temporarily unavailable."
      },
      source: "unavailable" as const,
      warnings: ["Smart-money intelligence is temporarily unavailable."]
    };
  });
  const response: SmartMoneyResponse = {
    data: {
      wallets: result.wallets,
      comparison: result.comparison
    },
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      warnings: result.warnings
    }
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as AddSmartWalletRequest;

  if (!body.walletAddress) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  try {
    await addSmartWalletToWatchlist({
      walletAddress: body.walletAddress,
      label: body.label ?? body.walletAddress
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not add this wallet." }, { status: 400 });
  }
}
