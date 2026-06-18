import { NextResponse, type NextRequest } from "next/server";
import { getPortfolioScreenWithXerberus } from "@/features/xerberus/services/xerberus-route-service";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? "";
  const result = await getPortfolioScreenWithXerberus(walletAddress);

  return NextResponse.json({
    data: result.data,
    meta: {
      generatedAt: new Date().toISOString(),
      source: result.source,
      status: result.status,
      warnings: result.warnings
    }
  });
}
