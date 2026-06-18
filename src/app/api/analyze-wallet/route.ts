import { NextResponse, type NextRequest } from "next/server";
import { getWalletAnalysisWithXerberus } from "@/features/xerberus/services/xerberus-route-service";
import type { AnalyzeWalletResponse } from "@/types/api";

interface AnalyzeWalletRequest {
	walletAddress?: string;
}

export async function GET(request: NextRequest) {
	const walletAddress = request.nextUrl.searchParams.get("walletAddress") ?? "";
	const result = await getWalletAnalysisWithXerberus(walletAddress);

	const response: AnalyzeWalletResponse = {
		data: result.data,
		meta: {
			generatedAt: new Date().toISOString(),
			source: result.source,
			status: result.status,
			warnings: result.warnings,
		},
	};

	return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
	const body = (await request.json().catch(() => ({}))) as AnalyzeWalletRequest;
	const result = await getWalletAnalysisWithXerberus(body.walletAddress ?? "");

	const response: AnalyzeWalletResponse = {
		data: result.data,
		meta: {
			generatedAt: new Date().toISOString(),
			source: result.source,
			status: result.status,
			warnings: result.warnings,
		},
	};

	return NextResponse.json(response);
}
