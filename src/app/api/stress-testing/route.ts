import { NextResponse, type NextRequest } from "next/server";
import { getStressTestingWithXerberus } from "@/features/xerberus/services/xerberus-route-service";
import type { StressTestingResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? undefined;
  const result = await getStressTestingWithXerberus(walletAddress);

  const response: StressTestingResponse = {
    data: result.data,
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      status: result.status,
      warnings: result.warnings
    }
  };

  return NextResponse.json(response);
}
