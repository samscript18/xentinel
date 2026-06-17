import { NextResponse, type NextRequest } from "next/server";
import { getPanicOutflowWithXerberus } from "@/features/xerberus/services/xerberus-route-service";
import type { RiskMigrationResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? undefined;
  const result = await getPanicOutflowWithXerberus(walletAddress);

  const response: RiskMigrationResponse = {
    data: result.data,
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      warnings: result.warnings
    }
  };

  return NextResponse.json(response);
}
