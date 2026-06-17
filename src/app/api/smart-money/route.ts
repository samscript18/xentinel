import { NextResponse } from "next/server";
import { getSmartMoneyLive } from "@/features/smart-money/services/smart-money-service";
import type { SmartMoneyResponse } from "@/types/api";

export async function GET() {
  const result = await getSmartMoneyLive().catch((error) => {
    console.warn("[smart-money]", error instanceof Error ? error.message : "Unknown smart-money error");
    return {
      wallets: [],
      source: "unavailable" as const,
      warnings: ["Smart-money intelligence is temporarily unavailable."]
    };
  });
  const response: SmartMoneyResponse = {
    data: {
      wallets: result.wallets
    },
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      warnings: result.warnings
    }
  };

  return NextResponse.json(response);
}
