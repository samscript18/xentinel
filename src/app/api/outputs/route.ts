import { NextResponse, type NextRequest } from "next/server";
import { getBeautifulOutputsWithXerberus } from "@/features/xerberus/services/xerberus-route-service";
import type { BeautifulOutputsResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? undefined;
  const result = await getBeautifulOutputsWithXerberus(walletAddress);

  const response: BeautifulOutputsResponse = {
    data: result.data,
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      warnings: result.warnings
    }
  };

  return NextResponse.json(response);
}
