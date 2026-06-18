import { NextResponse, type NextRequest } from "next/server";
import { xerberusService } from "@/features/xerberus/services/xerberus-service";
import { isRecord } from "@/features/xerberus/utils/xerberus-route-utils";

type ProbeToolName = "rate_entity" | "get_portfolio_brief" | "portfolio_ladder" | "simulate_scenario" | "crowding_queue" | "look_through";

interface ProbeResult {
	tool: ProbeToolName;
	ok: boolean;
	useful: boolean;
	dataKeys: string[];
	counts: Record<string, number>;
	summary?: string;
	error?: string;
}

function countCollections(value: unknown, prefix = "data", depth = 0): Record<string, number> {
	if (depth > 2) {
		return {};
	}

	if (Array.isArray(value)) {
		return { [prefix]: value.length };
	}

	if (!isRecord(value)) {
		return {};
	}

	return Object.entries(value).reduce<Record<string, number>>((counts, [key, nested]) => {
		if (Array.isArray(nested)) {
			counts[key] = nested.length;
			return counts;
		}

		if (isRecord(nested)) {
			return {
				...counts,
				...countCollections(nested, `${prefix}.${key}`, depth + 1),
			};
		}

		return counts;
	}, {});
}

function hasUsefulScalar(value: unknown): boolean {
	if (typeof value === "string") {
		return value.trim().length > 0 && value !== "NR";
	}

	if (typeof value === "number") {
		return Number.isFinite(value) && value !== 0;
	}

	if (typeof value === "boolean") {
		return true;
	}

	return false;
}

function usefulData(value: unknown, depth = 0): boolean {
	if (depth > 4) {
		return false;
	}

	if (hasUsefulScalar(value)) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.length > 0 && value.some((item) => usefulData(item, depth + 1));
	}

	if (!isRecord(value)) {
		return false;
	}

	return Object.values(value).some((nested) => usefulData(nested, depth + 1));
}

function summaryFromData(data: unknown) {
	if (!isRecord(data)) {
		return undefined;
	}

	const summary = data.summary ?? data.rating ?? data.grade ?? data.status ?? data.scenario;
	return typeof summary === "string" ? summary : undefined;
}

async function probeTool(tool: ProbeToolName, call: () => Promise<{ data: unknown }>): Promise<ProbeResult> {
	try {
		const response = await call();
		const data = response.data;

		return {
			tool,
			ok: true,
			useful: usefulData(data),
			dataKeys: isRecord(data) ? Object.keys(data).slice(0, 24) : [],
			counts: countCollections(data),
			summary: summaryFromData(data),
		};
	} catch {
		return {
			tool,
			ok: false,
			useful: false,
			dataKeys: [],
			counts: {},
			error: "Tool call failed. Check server logs for sanitized details.",
		};
	}
}

export async function GET(request: NextRequest) {
	const walletAddress = request.nextUrl.searchParams.get("wallet")?.trim();

	if (!walletAddress) {
		return NextResponse.json({ error: "Missing wallet query parameter." }, { status: 400 });
	}

	const results = await Promise.all([
		probeTool("rate_entity", () => xerberusService.rateEntity({ walletAddress })),
		probeTool("get_portfolio_brief", () => xerberusService.getPortfolioBrief({ walletAddress })),
		probeTool("portfolio_ladder", () => xerberusService.getPortfolioLadder({ walletAddress })),
		probeTool("simulate_scenario", () => xerberusService.simulateScenario({ walletAddress, scenario: "usdc_depeg" })),
		probeTool("crowding_queue", () => xerberusService.getCrowdingQueue({ walletAddress })),
		probeTool("look_through", () => xerberusService.getRiskDecomposition({ walletAddress })),
	]);

	console.log(`[probe-wallet] Probed wallet ${walletAddress} with tools. Results:`, results);

	return NextResponse.json({
		walletAddress,
		usefulTools: results.filter((result) => result.ok && result.useful).map((result) => result.tool),
		emptyOrUnavailableTools: results.filter((result) => !result.ok || !result.useful).map((result) => result.tool),
		results,
	});
}
