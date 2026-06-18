import type {
  XerberusRouteResult
} from "@/features/xerberus/types";
import type {
  BeautifulOutputsResult,
  ContagionMap,
  ContagionNode,
  LiquidityLadderStep,
  PortfolioPosition,
  RiskMigrationEvent,
  RiskRating,
  StressScenario,
  StressTestingResult,
  WalletAnalysis
} from "@/types/risk";

const validRatings: RiskRating[] = ["AAA", "AA", "A", "BBB", "BB", "B", "C", "D"];
const unavailableWarning = "Live risk intelligence is not available yet.";
const ratingBandScores: Record<Exclude<RiskRating, "NR">, number> = {
  AAA: 8,
  AA: 18,
  A: 32,
  BBB: 55,
  BB: 78,
  B: 88,
  C: 96,
  D: 100
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function numericFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.replace(/[%,$]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function percentScoreFrom(value: unknown) {
  const numeric = numericFrom(value);

  if (numeric === undefined) {
    return undefined;
  }

  return numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function ratingFrom(value: unknown): RiskRating | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value === "CC" || value === "CCC") {
    return "C";
  }

  return validRatings.includes(value as RiskRating)
    ? value as RiskRating
    : undefined;
}

function scoreFromRating(value: unknown) {
  const rating = ratingFrom(value);
  return rating && rating !== "NR" ? ratingBandScores[rating] : undefined;
}

export function trendFrom(score: number | undefined) {
  if (score === undefined || score <= 0) {
    return "stable";
  }

  if (score >= 70) {
    return "deteriorating";
  }

  if (score <= 35) {
    return "improving";
  }

  return "stable";
}

export function sourceFor(successes: number): XerberusRouteResult<unknown>["source"] {
  return successes > 0 ? "xerberus" : "unavailable";
}

export function unavailableResult<TData>(data: TData, warnings: string[] = []): XerberusRouteResult<TData> {
  return {
    data,
    source: "unavailable",
    status: "unavailable",
    warnings: uniqueStrings([unavailableWarning, ...warnings])
  };
}

export function liveResult<TData>(data: TData, warnings: string[] = [], status: XerberusRouteResult<TData>["status"] = "live"): XerberusRouteResult<TData> {
  return {
    data,
    source: warnings.length > 0 ? "mixed" : "xerberus",
    status,
    warnings: uniqueStrings(warnings)
  };
}

export function emptyWalletAnalysis(walletAddress = ""): WalletAnalysis {
  return {
    id: "analysis_unavailable",
    walletAddress,
    overallRiskScore: 0,
    intrinsicRisk: 0,
    systemicRisk: 0,
    rating: "NR",
    trend: "stable",
    analyzedAt: new Date().toISOString(),
    positions: []
  };
}

export function emptyStressTestingResult(): StressTestingResult {
  return {
    headline: "Run Stress Testing Engine after live risk intelligence is available.",
    panicMeter: 0,
    downsideExposureUsd: 0,
    liquidationBufferPercent: 0,
    crowdingQueueRank: "No live queue available",
    downsideTiming: "No downside timing available yet.",
    scenarios: [],
    exitLiquidityLadder: []
  };
}

export function emptyContagionMap(): ContagionMap {
  return {
    nodes: [],
    edges: [],
    highestRiskPath: []
  };
}

export function emptyPanicOutflowResult() {
  return {
    events: [] as RiskMigrationEvent[],
    panicMeter: 0,
    outflowSignals: [] as string[],
    ratingDriftSignals: [] as string[],
    systemicRiskSpikeIndicators: [] as string[],
    smartWalletExitComparison: "No live smart-money comparison available yet."
  };
}

export function emptyBeautifulOutputsResult(): BeautifulOutputsResult {
  return {
    reportStatus: "unavailable",
    generatedAt: new Date().toISOString(),
    artifacts: [],
    ratingDriftAlerts: [],
    disclaimer: "Not financial advice."
  };
}

export function normalizeRatingResponse(response: unknown) {
  if (typeof response === "string") {
    const rating = response.match(/\b(AAA|AA|A|BBB|BB|B|C|D)\b/)?.[1] as RiskRating | undefined;
    const score = response.match(/(?:score|risk|percentile)[^\d]*(\d+(?:\.\d+)?)/i)?.[1];

    return {
      rating: ratingFrom(rating),
      score: score ? numericFrom(score) : undefined,
      intrinsicRisk: undefined,
      systemicRisk: undefined,
      trend: undefined,
      reasons: [response]
    };
  }

  if (!isRecord(response)) {
    return {};
  }

  const intrinsic = isRecord(response.intrinsic) ? response.intrinsic : undefined;
  const riskinessScore = percentScoreFrom(response.riskiness_percentile ?? response.percentile);
  const ratingScore = scoreFromRating(response.rating ?? response.grade ?? response.risk_rating ?? response.riskRating ?? response.band);
  const intrinsicOpenSafeguards = numericFrom(intrinsic?.open_safeguards ?? intrinsic?.open_count);
  const intrinsicRisk = numericFrom(response.intrinsicRisk ?? response.intrinsic_risk ?? response.intrinsic_score)
    ?? (intrinsicOpenSafeguards !== undefined ? Math.min(100, intrinsicOpenSafeguards * 8) : undefined);
  const systemicRisk = numericFrom(response.systemicRisk ?? response.systemic_risk ?? response.systemic_score)
    ?? riskinessScore;

  return {
    rating: ratingFrom(response.rating ?? response.grade ?? response.risk_rating ?? response.riskRating ?? response.band),
    score: numericFrom(response.score ?? response.riskScore ?? response.risk_score ?? response.overallRiskScore ?? response.overall_risk_score) ?? riskinessScore ?? ratingScore,
    intrinsicRisk,
    systemicRisk,
    trend: stringFrom(response.trend),
    reasons: Array.isArray(response.reasons)
      ? response.reasons.filter((reason): reason is string => typeof reason === "string")
      : [
        response.reason,
        response.summary,
        response.note,
        response.message,
        response.description,
        intrinsic?.top_risk,
        intrinsic?.top_risk_precedent
      ].filter((reason): reason is string => typeof reason === "string" && reason.length > 0)
  };
}

export function normalizeScreenRatings(response: unknown) {
  if (Array.isArray(response)) {
    return response.map(normalizeRatingResponse);
  }

  if (isRecord(response) && Array.isArray(response.results)) {
    return response.results.map(normalizeRatingResponse);
  }

  if (isRecord(response) && Array.isArray(response.rows)) {
    return response.rows.map(normalizeRatingResponse);
  }

  return [];
}

export function responseSummary(response: unknown): string | undefined {
  if (typeof response === "string" && response.trim().length > 0) {
    return response;
  }

  if (!isRecord(response)) {
    return undefined;
  }

  const direct = [response.summary, response.note, response.message, response.text, response.description]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (direct) {
    return direct;
  }

  const nested = Object.entries(response).find(([key, value]) => {
    if (["data_window", "window", "timestamp", "generatedAt", "generated_at"].includes(key)) {
      return false;
    }

    if (typeof value !== "string" || value.trim().length <= 20) {
      return false;
    }

    return !/^\d{4}-\d{2}-\d{2}T/.test(value);
  })?.[1];
  return typeof nested === "string" ? nested : undefined;
}

function recordsFromArrays(value: unknown, keys: string[], depth = 0): Record<string, unknown>[] {
  if (depth > 4) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const normalizedKey = key.toLowerCase();
    if (keys.some((hint) => normalizedKey.includes(hint))) {
      return recordsFromArrays(nested, keys, depth + 1);
    }

    if (isRecord(nested)) {
      return recordsFromArrays(nested, keys, depth + 1);
    }

    return [];
  });
}

export function intrinsicRiskReasons(response: unknown) {
  if (typeof response === "string" && response.trim().length > 0) {
    return [response];
  }

  const records = recordsFromArrays(response, ["risks", "failure", "issues", "modes", "safeguards"]);

  if (records.length === 0) {
    const summary = responseSummary(response);
    return summary ? [summary] : [];
  }

  return records
    .map((risk) => {
      const direct = firstString(risk, ["finding", "description", "title", "summary", "reason", "question", "name", "mode"]);
      if (direct) {
        return direct;
      }

      const tag = firstString(risk, ["tag"]);
      const precedent = firstString(risk, ["precedent"]);

      if (tag && precedent) {
        return `${tag}: ${precedent}`;
      }

      return tag;
    })
    .filter((reason): reason is string => typeof reason === "string" && reason.length > 0);
}

export function systemicScoreFrom(response: unknown) {
  if (!isRecord(response)) {
    return undefined;
  }

  const sensitivities = isRecord(response.sensitivities) ? response.sensitivities : undefined;

  return numericFrom(response.score ?? response.systemicRisk ?? response.systemic_risk ?? response.systemic_score ?? response.risk_score)
    ?? percentScoreFrom(response.riskiness_percentile ?? response.percentile)
    ?? percentScoreFrom(sensitivities?.current_riskiness_percentile)
    ?? scoreFromRating(response.rating ?? response.grade)
    ?? numericFrom(response.vulnerability);
}

export function systemicDependencies(response: unknown) {
  const records = recordsFromArrays(response, ["dependencies", "dependency", "exposures", "exposure", "factors", "factor", "roots", "venues", "markets", "assets", "top_spof", "per_subject", "subjects", "collateral", "tokens", "rows"]);

  return records
    .flatMap((dependency) => {
      const name = firstString(dependency, ["name", "label", "protocol", "asset", "token", "market", "venue", "factor", "node_id", "subject"]);

      if (!name) {
        return [];
      }

      return [{
        name,
        category: firstString(dependency, ["category", "type", "kind", "node_type", "object_class"]),
        exposure: numericFrom(dependency.exposure ?? dependency.exposureUsd ?? dependency.exposure_usd ?? dependency.valueUsd ?? dependency.value_usd ?? dependency.weight ?? dependency.outbound_criticality ?? dependency.exposure_usd ?? dependency.combined_exposure_usd)
      }];
    });
}

function severityFrom(score: number): StressScenario["severity"] {
  if (score >= 85) {
    return "critical";
  }

  if (score >= 65) {
    return "high";
  }

  return "moderate";
}

export function scenarioFrom(id: string, name: string, response: StressScenarioResponseLike | undefined): StressScenario | undefined {
  if (!response) {
    return undefined;
  }

  const record = isRecord(response) ? response : {};
  const drawdown = clamp(numericFrom(response.drawdownPercent ?? record.drawdown_percent ?? record.loss_pct ?? record.lossPercent ?? record.portfolioDrawdownPercent) ?? 0);
  const systemicRisk = clamp(numericFrom(response.systemicRiskAfterShock ?? record.systemic_risk_after_shock ?? record.risk_score ?? record.score) ?? 0);
  const summary = responseSummary(response);

  return {
    id,
    name,
    impactSummary: summary ?? "Scenario analysis completed.",
    portfolioDrawdownPercent: drawdown,
    systemicRiskAfterShock: systemicRisk,
    severity: severityFrom(systemicRisk)
  };
}

interface StressScenarioResponseLike {
  drawdownPercent?: number;
  systemicRiskAfterShock?: number;
  summary?: string;
}

export function liquidityLadderFrom(response: unknown): LiquidityLadderStep[] {
  const directSteps = isRecord(response)
    ? response.steps ?? response.exit_ladder ?? response.liquidity_ladder
    : undefined;
  const ladder = isRecord(response) && isRecord(response.ladder) ? response.ladder : undefined;
  const ladderSteps: Record<string, unknown>[] = ladder
    ? Object.entries(ladder).flatMap(([window, value]) => isRecord(value) ? [{ ...value, window }] : [])
    : [];
  const rungs = isRecord(response) && Array.isArray(response.rungs) ? response.rungs.filter(isRecord) : [];
  const steps: Record<string, unknown>[] = Array.isArray(directSteps) ? directSteps.filter(isRecord) : ladderSteps.length > 0 ? ladderSteps : rungs;

  if (steps.length === 0) {
    return [];
  }

  return steps.map((step, index) => {
    const rawPercent = numericFrom(step.exitablePercent ?? step.exitable_percent ?? step.exit_pct ?? step.share_exitable_pct ?? step.percent ?? step.pct ?? step.pct_of_book);
    const exitablePercent = rawPercent !== undefined && rawPercent <= 1 ? rawPercent * 100 : rawPercent;
    const rawWindow = firstString(step, ["window", "label", "bucket", "horizon", "timeframe", "time"]);
    const days = numericFrom(step.days ?? step.horizon_days ?? step.day);
    const exitableUsd = numericFrom(step.exitable_usd ?? step.exitableUsd ?? step.usd);

    return {
      window: rawWindow ?? (days !== undefined ? `${days}d` : `Step ${index + 1}`),
      exitablePercent: clamp(exitablePercent ?? 0),
      expectedSlippagePercent: Math.max(0, numericFrom(step.expectedSlippagePercent ?? step.expected_slippage_percent ?? step.slippage_pct ?? step.impact_pct ?? step.price_impact_pct) ?? 0),
      note: firstString(step, ["note", "summary", "description", "caveat"]) ?? (exitableUsd !== undefined ? `$${Math.round(exitableUsd).toLocaleString()} exitable in this window.` : exitablePercent === undefined ? "Liquidity band returned by Xerberus; no numeric exit percentage was provided." : "Exit ladder step.")
    };
  });
}

export function dependencyNode(dependency: ReturnType<typeof systemicDependencies>[number], index: number): ContagionNode {
  const normalizedName = dependency.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const category: ContagionNode["category"] = dependency.category?.toLowerCase().includes("asset") ? "Asset" : "Protocol";

  return {
    id: normalizedName || `dependency-${index}`,
    label: dependency.name,
    rating: "NR",
    exposureUsd: Math.round((dependency.exposure ?? 0) * 1000),
    category
  };
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function labelFromIdentifier(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const knownTokens: Record<string, string> = {
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
    "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE",
    "0xd533a949740bb3306d119cc777fa900ba034cd52": "CRV"
  };
  const lower = value.toLowerCase();

  if (knownTokens[lower]) {
    return knownTokens[lower];
  }

  return value
    .split(":")
    .filter(Boolean)
    .map((segment) => segment.replace(/[_-]+/g, " "))
    .map((segment) => segment.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" ");
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function likelyPositionRecord(record: Record<string, unknown>) {
  return Boolean(
    firstString(record, ["protocol", "protocolName", "venue", "market", "entity", "name", "token", "symbol", "asset", "pool_uid"]) ||
    firstNumber(record, ["valueUsd", "usdValue", "balanceUsd", "exposureUsd", "notionalUsd", "amountUsd", "amount_usd", "value"])
  );
}

function collectPositionRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4) {
    return [];
  }

  if (Array.isArray(value)) {
    const records = value.filter(isRecord);
    const likely = records.filter(likelyPositionRecord);

    if (likely.length > 0) {
      return likely;
    }

    return records.flatMap((record) => collectPositionRecords(record, depth + 1));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (likelyPositionRecord(value)) {
    return [value];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const lowerKey = key.toLowerCase();
    if (["positions", "holdings", "exposures", "venues", "markets", "assets", "tokens", "portfolio", "items", "results"].some((hint) => lowerKey.includes(hint))) {
      return collectPositionRecords(nested, depth + 1);
    }

    return [];
  });
}

function positionFromRecord(record: Record<string, unknown>, index: number, total: number, rating?: ReturnType<typeof normalizeRatingResponse>, systemicScore?: number): PortfolioPosition {
  const poolUid = firstString(record, ["pool_uid", "market_uid", "marketId"]);
  const protocol = firstString(record, ["protocol", "protocolName", "venue", "market", "entity", "name"])
    ?? labelFromIdentifier(poolUid?.split(":")[0])
    ?? `Position ${index + 1}`;
  const rawAsset = firstString(record, ["asset", "symbol", "token", "underlying", "collateral"]);
  const asset = labelFromIdentifier(rawAsset) ?? protocol;
  const chain = firstString(record, ["chain", "network", "chainId"]) ?? "ethereum";
  const address = firstString(record, ["address", "tokenAddress", "marketId", "entityId", "id", "token", "pool_uid"]);
  const valueUsd = Math.round(firstNumber(record, ["valueUsd", "usdValue", "balanceUsd", "exposureUsd", "notionalUsd", "amountUsd", "amount_usd", "value"]) ?? 0);
  const positionRating = rating?.rating ?? ratingFrom(record.rating ?? record.grade) ?? "NR";
  const intrinsicRisk = clamp(rating?.intrinsicRisk ?? numberFrom(record.intrinsicRisk ?? record.intrinsic_risk) ?? 0);
  const systemicRisk = clamp(rating?.systemicRisk ?? numberFrom(record.systemicRisk ?? record.systemic_risk) ?? systemicScore ?? 0);
  const side = firstString(record, ["side"]);
  const reason = rating?.reasons?.[0]
    ?? firstString(record, ["reason", "summary", "riskReason", "risk_reason"])
    ?? `${side ? `${side[0].toUpperCase()}${side.slice(1)} ` : ""}position returned by Xerberus.`;

  return {
    id: [chain, address, protocol, asset, index].filter(Boolean).join(":").toLowerCase(),
    protocol,
    asset,
    chain,
    valueUsd,
    allocationPercent: total > 0 ? clamp((valueUsd / total) * 100) : 0,
    rating: positionRating,
    intrinsicRisk,
    systemicRisk,
    mainRiskReason: reason
  };
}

export function portfolioPositionsFromXerberus(responses: unknown[], screenData: unknown, systemicScore?: number) {
  const records = responses.flatMap((response) => collectPositionRecords(response));
  const seen = new Set<string>();
  const uniqueRecords = records.filter((record, index) => {
    const key = JSON.stringify({
      id: firstString(record, ["id", "address", "tokenAddress", "marketId", "entityId", "pool_uid", "token"]),
      name: firstString(record, ["protocol", "protocolName", "venue", "market", "name", "symbol", "asset", "token"]),
      value: firstNumber(record, ["valueUsd", "usdValue", "balanceUsd", "exposureUsd", "notionalUsd", "amountUsd", "amount_usd", "value"]),
      index
    });

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
  const total = uniqueRecords.reduce((sum, record) => sum + (firstNumber(record, ["valueUsd", "usdValue", "balanceUsd", "exposureUsd", "notionalUsd", "amountUsd", "amount_usd", "value"]) ?? 0), 0);
  const screenRatings = normalizeScreenRatings(screenData);

  return uniqueRecords
    .map((record, index) => positionFromRecord(record, index, total, screenRatings[index], systemicScore))
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

export function positionTargetsFromXerberus(response: unknown) {
  return collectPositionRecords(response)
    .map((record) => firstString(record, ["token", "asset", "symbol", "address", "tokenAddress"]))
    .filter((target): target is string => typeof target === "string" && target.trim().length > 0);
}
