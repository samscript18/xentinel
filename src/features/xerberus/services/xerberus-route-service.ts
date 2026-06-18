import "server-only";
import { getXerberusConfig } from "@/features/xerberus/config";
import { XerberusClientError } from "@/features/xerberus/services/xerberus-client";
import { xerberusService } from "@/features/xerberus/services/xerberus-service";
import { logXerberusWarning } from "@/features/xerberus/utils/xerberus-logger";
import {
  clamp,
  emptyBeautifulOutputsResult,
  emptyContagionMap,
  emptyPanicOutflowResult,
  emptyStressTestingResult,
  emptyWalletAnalysis,
  intrinsicRiskReasons,
  isRecord,
  liquidityLadderFrom,
  liveResult,
  normalizeRatingResponse,
  numberFrom,
  positionTargetsFromXerberus,
  portfolioPositionsFromXerberus,
  scenarioFrom,
  sourceFor,
  stringFrom,
  trendFrom,
  uniqueStrings,
  unavailableResult
} from "@/features/xerberus/utils/xerberus-route-utils";
import type {
  CrowdingQueueResponse,
  IntrinsicRiskResponse,
  PortfolioLadderResponse,
  RatingResponse,
  ReportResponse,
  StressScenarioResponse,
} from "@/features/xerberus/types";
import type {
  BeautifulOutputsResult,
  ContagionMap,
  ContagionNode,
  RiskMigrationEvent,
  RiskRating,
  StressScenario,
  StressTestingResult,
  WalletAnalysis
} from "@/types/risk";

interface ToolAttempt<TData> {
  data?: TData;
  warning?: string;
}

export interface PortfolioIntrinsicSection {
  score: number;
  risks: string[];
}

export interface PortfolioSystemicSection {
  score: number;
  summary?: string;
  dependencies: Array<{
    name: string;
    category?: string;
    exposure?: number;
  }>;
}

export interface PortfolioScreenSection {
  positions: WalletAnalysis["positions"];
}

function warningForTool(label: string, error: unknown) {
  if (error instanceof XerberusClientError && error.code === "upstream_blocked") {
    return "Live risk intelligence is temporarily unavailable.";
  }

  if (error instanceof XerberusClientError && error.code === "timeout") {
    if (label === "rate_entity" || label === "rate_token" || label === "rate_market") {
      return "Live rating request timed out. Try again or analyze a token/protocol input.";
    }

    if (label === "get_failure_modes" || label === "intrinsic_open_risks" || label === "portfolio_intrinsic_posture") {
      return "Intrinsic risk details are temporarily unavailable.";
    }

    if (label === "look_through" || label === "risk_decomposition" || label === "rating_outlook") {
      return "Systemic risk details are temporarily unavailable.";
    }

    if (label === "screen") {
      return "Position screening is temporarily unavailable.";
    }
  }

  if (label === "get_failure_modes" || label === "intrinsic_open_risks" || label === "portfolio_intrinsic_posture") {
    return "Intrinsic risk details are temporarily unavailable.";
  }

  if (label === "look_through" || label === "risk_decomposition" || label === "rating_outlook") {
    return "Systemic risk details are temporarily unavailable.";
  }

  if (label === "screen") {
    return "Position screening is temporarily unavailable.";
  }

  return `${label} is temporarily unavailable.`;
}

function ratingHasUsableRiskData(rating: ReturnType<typeof normalizeRatingResponse>) {
  return Boolean(rating.rating || rating.score !== undefined || rating.intrinsicRisk !== undefined || rating.systemicRisk !== undefined);
}

function textIndicatesUnavailable(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized.includes("unknown tool") || normalized.includes("not available") || normalized.includes("no risk scores");
}

function payloadHasError(value: unknown) {
  if (typeof value === "string") {
    return /^(Unknown tool|Error executing tool)/i.test(value.trim());
  }

  if (!isRecord(value)) {
    return false;
  }

  return typeof value.error === "string" && value.error.trim().length > 0;
}

function scoreFromOpenRiskCount(value: unknown) {
  if (!isRecord(value)) {
    return 0;
  }

  const openCount = numberFrom(value.open_count);
  const unknownExposure = numberFrom(value.unknown_rate_exposure_weighted);

  if (unknownExposure !== undefined) {
    return clamp(unknownExposure * 100);
  }

  if (openCount !== undefined) {
    return clamp(openCount * 8);
  }

  return 0;
}

function weightedAverageRisk(
  positions: WalletAnalysis["positions"],
  selector: (position: WalletAnalysis["positions"][number]) => number
) {
  const totalValue = positions.reduce((sum, position) => sum + Math.max(0, position.valueUsd), 0);

  if (totalValue <= 0) {
    const values = positions.map(selector).filter((value) => value > 0);
    return values.length > 0 ? clamp(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }

  return clamp(positions.reduce((sum, position) => sum + selector(position) * (Math.max(0, position.valueUsd) / totalValue), 0));
}

function nestedNumber(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return numberFrom(current);
}

function hasDebtPosition(value: unknown, depth = 0): boolean {
  if (depth > 5) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasDebtPosition(item, depth + 1));
  }

  if (!isRecord(value)) {
    return false;
  }

  const side = stringFrom(value.side)?.toLowerCase();
  if (side && ["debt", "borrow", "borrowed"].some((hint) => side.includes(hint))) {
    return true;
  }

  const debtUsd = numberFrom(value.debt_usd) ?? numberFrom(value.debtUsd) ?? numberFrom(value.borrow_usd) ?? numberFrom(value.borrowUsd);
  if (debtUsd !== undefined && debtUsd > 0) {
    return true;
  }

  return Object.values(value).some((nested) => hasDebtPosition(nested, depth + 1));
}

function stressMetricsFromLadder(ladderData: unknown, ladderSteps: StressTestingResult["exitLiquidityLadder"]) {
  const record = isRecord(ladderData) ? ladderData : {};
  const bookUsd = numberFrom(record.book_usd) ?? numberFrom(record.bookUsd) ?? 0;
  const oneDayStep = ladderSteps.find((step) => step.window.toLowerCase() === "1d") ?? ladderSteps[0];
  const sevenDayStep = ladderSteps.find((step) => step.window.toLowerCase() === "7d");
  const oneDayExitablePercent = oneDayStep?.exitablePercent ?? 0;
  const sevenDayExitablePercent = sevenDayStep?.exitablePercent;
  const oneDayExitableUsd = nestedNumber(record, ["ladder", "1d", "exitable_usd"]) ?? 0;
  const slowestTokenDays = numberFrom(record.slowest_token_days);
  const notImmediatelyExitableUsd = bookUsd > 0 ? Math.max(0, bookUsd - oneDayExitableUsd) : 0;

  return {
    panicMeter: clamp(100 - oneDayExitablePercent),
    downsideExposureUsd: Math.round(notImmediatelyExitableUsd),
    headline: sevenDayExitablePercent !== undefined
      ? `${oneDayExitablePercent}% of this wallet can exit within 1 day at the selected impact band; ${sevenDayExitablePercent}% can exit within 7 days.`
      : `${oneDayExitablePercent}% of this wallet can exit within 1 day at the selected impact band.`,
    downsideTiming: slowestTokenDays !== undefined
      ? `The slowest position is estimated to need about ${slowestTokenDays.toFixed(1)} days to exit.`
      : "Review the exit liquidity ladder for downside timing."
  };
}

function slugifyNodeId(value: string, fallback: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return normalized || fallback;
}

function severityFromScore(score: number): RiskMigrationEvent["severity"] {
  if (score >= 80) {
    return "high";
  }

  if (score >= 55) {
    return "medium";
  }

  return "low";
}

function scoreLabel(score: number) {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 65) {
    return "elevated";
  }

  if (score >= 40) {
    return "moderate";
  }

  return "low";
}

function outputSeverityFromScore(score: number): BeautifulOutputsResult["ratingDriftAlerts"][number]["severity"] {
  if (score >= 90) {
    return "critical";
  }

  if (score >= 70) {
    return "high";
  }

  return "medium";
}

function ratingFromScore(score: number): RiskRating {
  if (score >= 98) {
    return "C";
  }

  if (score >= 90) {
    return "B";
  }

  if (score >= 75) {
    return "BB";
  }

  if (score >= 55) {
    return "BBB";
  }

  if (score >= 35) {
    return "A";
  }

  if (score >= 20) {
    return "AA";
  }

  return "AAA";
}

function worstPositionRating(positions: WalletAnalysis["positions"]) {
  const ratingRisk: Record<Exclude<RiskRating, "NR">, number> = {
    AAA: 1,
    AA: 2,
    A: 3,
    BBB: 4,
    BB: 5,
    B: 6,
    C: 7,
    D: 8
  };

  return positions
    .map((position) => position.rating)
    .filter((rating): rating is Exclude<RiskRating, "NR"> => rating !== "NR")
    .sort((left, right) => ratingRisk[right] - ratingRisk[left])[0];
}

function contagionMapFromPositions(wallet: WalletAnalysis): ContagionMap {
  const nodesById = new Map<string, ContagionNode>();
  const edgesById = new Map<string, ContagionMap["edges"][number]>();

  nodesById.set("wallet", {
    id: "wallet",
    label: "Your Position",
    rating: wallet.rating,
    exposureUsd: wallet.positions.reduce((sum, position) => sum + position.valueUsd, 0),
    category: "User"
  });

  wallet.positions.slice(0, 8).forEach((position, index) => {
    const assetId = `asset-${slugifyNodeId(position.asset, `asset-${index}`)}`;
    const protocolId = `protocol-${slugifyNodeId(position.protocol, `protocol-${index}`)}`;
    const riskWeight = clamp(position.systemicRisk || wallet.systemicRisk) / 100;
    const allocationWeight = Math.max(0.1, Math.min(1, position.allocationPercent / 100));
    const exposureWeight = riskWeight > 0 ? riskWeight : allocationWeight;

    if (!nodesById.has(assetId)) {
      nodesById.set(assetId, {
        id: assetId,
        label: position.asset,
        rating: position.rating,
        exposureUsd: position.valueUsd,
        category: "Asset"
      });
    }

    if (!nodesById.has(protocolId)) {
      nodesById.set(protocolId, {
        id: protocolId,
        label: position.protocol,
        rating: position.rating,
        exposureUsd: position.valueUsd,
        category: "Protocol"
      });
    }

    edgesById.set(`${assetId}->${protocolId}`, {
      id: `asset_protocol_edge_${index}`,
      source: assetId,
      target: protocolId,
      dependency: "Position exposure",
      weight: exposureWeight
    });

    edgesById.set(`${protocolId}->wallet`, {
      id: `protocol_wallet_edge_${index}`,
      source: protocolId,
      target: "wallet",
      dependency: "Portfolio exposure",
      weight: exposureWeight
    });
  });

  const highestRiskPosition = [...wallet.positions].sort((left, right) => {
    const leftRisk = Math.max(left.systemicRisk, left.intrinsicRisk);
    const rightRisk = Math.max(right.systemicRisk, right.intrinsicRisk);
    return rightRisk - leftRisk;
  })[0];

  return {
    nodes: Array.from(nodesById.values()),
    edges: Array.from(edgesById.values()),
    highestRiskPath: highestRiskPosition
      ? [highestRiskPosition.asset, highestRiskPosition.protocol, "Your Position"]
      : []
  };
}

function panicEventsFromPortfolioAndStress(
  portfolio: WalletAnalysis,
  stress: StressTestingResult,
  warnings: string[] = []
) {
  const timestamp = new Date().toISOString();
  const events: RiskMigrationEvent[] = [];
  const riskScore = clamp(Math.max(portfolio.overallRiskScore, portfolio.systemicRisk));
  const highestRiskPosition = [...portfolio.positions].sort((left, right) => {
    const leftRisk = Math.max(left.systemicRisk, left.intrinsicRisk);
    const rightRisk = Math.max(right.systemicRisk, right.intrinsicRisk);
    return rightRisk - leftRisk;
  })[0];

  if (portfolio.rating !== "NR" || riskScore > 0) {
    events.push({
      id: "wallet-risk-posture",
      protocol: "Wallet risk posture",
      oldRating: "NR",
      newRating: portfolio.rating,
      confidence: 0.82,
      timestamp,
      signal: `Wallet is rated ${portfolio.rating} with ${riskScore}/100 relative risk.`,
      severity: severityFromScore(riskScore),
      timeframe: "Current Xerberus window",
      reason: `Systemic risk is ${portfolio.systemicRisk}/100 and intrinsic risk is ${portfolio.intrinsicRisk}/100.`,
      smartWalletMovement: "Smart-wallet comparison is tracked separately in Smart Money Sentinel.",
      downgradeProbability: riskScore
    });
  }

  if (highestRiskPosition) {
    const positionRisk = clamp(Math.max(highestRiskPosition.systemicRisk, highestRiskPosition.intrinsicRisk));
    events.push({
      id: `position-risk-${highestRiskPosition.id}`,
      protocol: highestRiskPosition.protocol,
      oldRating: "NR",
      newRating: highestRiskPosition.rating,
      confidence: 0.78,
      timestamp,
      signal: `${highestRiskPosition.asset} is the highest-risk live position currently returned for this wallet.`,
      severity: severityFromScore(positionRisk),
      timeframe: "Current holdings",
      reason: highestRiskPosition.mainRiskReason,
      smartWalletMovement: "Smart-wallet comparison is tracked separately in Smart Money Sentinel.",
      downgradeProbability: positionRisk
    });
  }

  if (stress.exitLiquidityLadder.length > 0 || stress.panicMeter > 0) {
    events.push({
      id: "exit-liquidity-pressure",
      protocol: "Exit liquidity",
      oldRating: "NR",
      newRating: portfolio.rating,
      confidence: 0.76,
      timestamp,
      signal: stress.headline,
      severity: severityFromScore(stress.panicMeter),
      timeframe: "Exit window",
      reason: stress.downsideTiming,
      smartWalletMovement: "Smart-wallet comparison is tracked separately in Smart Money Sentinel.",
      downgradeProbability: clamp(stress.panicMeter)
    });
  }

  const panicMeter = clamp(Math.max(riskScore, stress.panicMeter));
  const ratingDriftSignals = portfolio.rating === "NR"
    ? []
    : [`Current wallet rating is ${portfolio.rating}; no historical drift window was returned in this scan.`];
  const systemicRiskSpikeIndicators = uniqueStrings([
    ...(portfolio.systemicRisk >= 70 ? [`Wallet systemic risk is ${portfolio.systemicRisk}/100 (${scoreLabel(portfolio.systemicRisk)}).`] : []),
    ...(highestRiskPosition && highestRiskPosition.systemicRisk >= 70
      ? [`${highestRiskPosition.protocol} / ${highestRiskPosition.asset} systemic risk is ${highestRiskPosition.systemicRisk}/100.`]
      : [])
  ]);
  const outflowSignals = stress.exitLiquidityLadder.length > 0
    ? [stress.headline]
    : [];

  return {
    data: {
      events,
      panicMeter,
      outflowSignals,
      ratingDriftSignals,
      systemicRiskSpikeIndicators,
      smartWalletExitComparison: "Smart-money comparison is available in Smart Money Sentinel."
    },
    warnings
  };
}

async function withSoftTimeout<TValue>(promise: Promise<TValue>, timeoutMs: number, fallback: TValue): Promise<TValue> {
  return Promise.race([
    promise,
    new Promise<TValue>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    })
  ]);
}

async function attemptXerberusTool<TData>(
  label: string,
  call: () => Promise<{ data: TData }>
): Promise<ToolAttempt<TData>> {
  try {
    const response = await call();
    return { data: response.data };
  } catch (error) {
    logXerberusWarning(`${label} failed during product API enrichment.`, error);
    return {
      warning: warningForTool(label, error)
    };
  }
}

async function getRatedPositions(walletAddress: string, systemicFallback?: number) {
  const positionRows = await attemptXerberusTool<unknown>("get_positions", () => xerberusService.getPositions({ walletAddress }));
  const tokenTargets = uniqueStrings(positionTargetsFromXerberus(positionRows.data)).slice(0, 8);
  const tokenRatingAttempts = await Promise.all(
    tokenTargets.map((target) => attemptXerberusTool<RatingResponse>(`rate_token:${target}`, () => xerberusService.rateToken({ address: target })))
  );
  const tokenRatings = tokenRatingAttempts.map((attempt) => attempt.data).filter((data): data is RatingResponse => Boolean(data));
  const positions = portfolioPositionsFromXerberus([positionRows.data], tokenRatings, systemicFallback);
  const warnings = [
    positionRows.warning,
    ...tokenRatingAttempts.map((attempt) => attempt.warning)
  ].filter((warning): warning is string => Boolean(warning));

  return {
    positions,
    warnings,
    hasPositionRows: Boolean(positionRows.data)
  };
}

async function getPositionProfile(walletAddress: string, systemicFallback?: number) {
  const positionRows = await attemptXerberusTool<unknown>("get_positions", () => xerberusService.getPositions({ walletAddress }));
  const positions = portfolioPositionsFromXerberus([positionRows.data], [], systemicFallback);

  return {
    positions,
    warnings: positionRows.warning ? [positionRows.warning] : [],
    hasPositionRows: Boolean(positionRows.data)
  };
}

async function getExitLadderStress(walletAddress: string) {
  const ladder = await attemptXerberusTool<PortfolioLadderResponse>("portfolio_ladder", () => xerberusService.getPortfolioLadder({ walletAddress }));
  const ladderSteps = liquidityLadderFrom(ladder.data);
  const ladderMetrics = stressMetricsFromLadder(ladder.data, ladderSteps);

  return {
    data: {
      ...emptyStressTestingResult(),
      ...ladderMetrics,
      panicMeter: ladderSteps.length > 0 ? ladderMetrics.panicMeter : 0,
      exitLiquidityLadder: ladderSteps
    },
    warnings: ladder.warning ? [ladder.warning] : []
  };
}

export async function getWalletAnalysisWithXerberus(walletAddress = "") {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyWalletAnalysis(walletAddress));
  }

  const [entity, positionProfile] = await Promise.all([
    attemptXerberusTool<RatingResponse>("rate_entity", () => xerberusService.rateEntity({ walletAddress })),
    getRatedPositions(walletAddress)
  ]);
  const successes = [entity.data, positionProfile.hasPositionRows ? positionProfile.positions : undefined].filter((data) => data !== undefined).length;
  const warnings = [entity.warning, ...positionProfile.warnings].filter((warning): warning is string => Boolean(warning));

  if (successes === 0) {
    return unavailableResult(emptyWalletAnalysis(walletAddress), warnings);
  }

  const entityRating = normalizeRatingResponse(entity.data);
  const positions = entityRating.systemicRisk !== undefined
    ? positionProfile.positions.map((position) => ({
      ...position,
      systemicRisk: position.systemicRisk > 0 ? position.systemicRisk : clamp(entityRating.systemicRisk ?? 0)
    }))
    : positionProfile.positions;
  const intrinsicRisk = entityRating.intrinsicRisk !== undefined
    ? clamp(entityRating.intrinsicRisk)
    : weightedAverageRisk(positions, (position) => position.intrinsicRisk);
  const systemicRisk = entityRating.systemicRisk !== undefined
    ? clamp(entityRating.systemicRisk)
    : weightedAverageRisk(positions, (position) => position.systemicRisk);
  const finalWarnings = uniqueStrings([
    ...warnings,
    ...(intrinsicRisk === 0 ? ["Intrinsic risk was not returned for this wallet or its current positions."] : [])
  ]);

  if (!ratingHasUsableRiskData(entityRating) && positions.length === 0) {
    return unavailableResult(
      emptyWalletAnalysis(walletAddress),
      uniqueStrings([...finalWarnings, entityRating.reasons?.[0] ?? "Wallet-level rating is not available for this address."])
    );
  }

  const highestPositionRisk = Math.max(0, ...positions.map((position) => Math.max(position.intrinsicRisk, position.systemicRisk)));
  const score = clamp(entityRating.score ?? Math.max(intrinsicRisk, systemicRisk, highestPositionRisk));
  const rating = entityRating.rating ?? worstPositionRating(positions) ?? (score > 0 ? ratingFromScore(score) : "NR");

  return liveResult<WalletAnalysis>({
    id: "analysis_live",
    walletAddress,
    overallRiskScore: score,
    intrinsicRisk,
    systemicRisk,
    rating,
    trend: entityRating.trend === "improving" || entityRating.trend === "deteriorating" ? entityRating.trend : trendFrom(score),
    analyzedAt: new Date().toISOString(),
    positions
  }, finalWarnings);
}

export async function getPortfolioIntrinsicWithXerberus(walletAddress = "") {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult<PortfolioIntrinsicSection>({ score: 0, risks: [] });
  }

  if (!walletAddress) {
    return unavailableResult<PortfolioIntrinsicSection>({ score: 0, risks: [] }, ["Select or analyze a wallet to view intrinsic risk details."]);
  }

  const positionProfile = await getRatedPositions(walletAddress);
  const positionRisks = uniqueStrings(positionProfile.positions.map((position) => position.mainRiskReason));
  const positionScore = weightedAverageRisk(positionProfile.positions, (position) => position.intrinsicRisk);

  if (positionProfile.positions.length > 0 && positionScore > 0) {
    return liveResult<PortfolioIntrinsicSection>({
      score: positionScore,
      risks: positionRisks
    }, positionProfile.warnings);
  }

  const intrinsic = await attemptXerberusTool<IntrinsicRiskResponse>("portfolio_intrinsic_posture", () => xerberusService.getPortfolioIntrinsicPosture({ walletAddress }));

  if (!intrinsic.data) {
    return unavailableResult<PortfolioIntrinsicSection>({ score: 0, risks: [] }, positionProfile.warnings.length > 0 ? positionProfile.warnings : intrinsic.warning ? [intrinsic.warning] : []);
  }

  const risks = intrinsicRiskReasons(intrinsic.data);
  const score = scoreFromOpenRiskCount(intrinsic.data);

  if (payloadHasError(intrinsic.data) || (risks.length === 0 && score === 0) || risks.some(textIndicatesUnavailable)) {
    return unavailableResult<PortfolioIntrinsicSection>({ score: 0, risks: [] }, uniqueStrings([...positionProfile.warnings, "Intrinsic risk details are temporarily unavailable."]));
  }

  return liveResult<PortfolioIntrinsicSection>({ score, risks }, uniqueStrings([...positionProfile.warnings, intrinsic.warning].filter((warning): warning is string => Boolean(warning))));
}

export async function getPortfolioSystemicWithXerberus(walletAddress = "") {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult<PortfolioSystemicSection>({ score: 0, dependencies: [] });
  }

  if (!walletAddress) {
    return unavailableResult<PortfolioSystemicSection>({ score: 0, dependencies: [] }, ["Select or analyze a wallet to view systemic risk details."]);
  }

  const portfolio = await getWalletAnalysisWithXerberus(walletAddress);

  if (portfolio.source === "unavailable") {
    return unavailableResult<PortfolioSystemicSection>({ score: 0, dependencies: [] }, portfolio.warnings);
  }

  const dependencies = portfolio.data.positions.map((position) => ({
    name: `${position.protocol} / ${position.asset}`,
    category: position.chain,
    exposure: position.valueUsd
  }));

  return liveResult<PortfolioSystemicSection>({
    score: portfolio.data.systemicRisk,
    summary: `Wallet rating ${portfolio.data.rating}; systemic risk ${portfolio.data.systemicRisk}/100.`,
    dependencies
  });
}

export async function getPortfolioScreenWithXerberus(walletAddress = "") {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult<PortfolioScreenSection>({ positions: [] });
  }

  if (!walletAddress) {
    return unavailableResult<PortfolioScreenSection>({ positions: [] }, ["Select or analyze a wallet to view position screening."]);
  }

  const positionProfile = await getRatedPositions(walletAddress);
  const positions = positionProfile.positions;
  const warnings = positionProfile.warnings;

  if (positions.length === 0) {
    return unavailableResult<PortfolioScreenSection>({ positions: [] }, warnings.length ? warnings : ["Position screening is temporarily unavailable."]);
  }

  return liveResult<PortfolioScreenSection>({ positions }, warnings);
}

export async function getStressTestingWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyStressTestingResult());
  }

  if (!walletAddress) {
    return unavailableResult(emptyStressTestingResult(), ["Select or analyze a wallet to run stress testing."]);
  }

  const [ladder, positionRows] = await Promise.all([
    attemptXerberusTool<PortfolioLadderResponse>("portfolio_ladder", () => xerberusService.getPortfolioLadder({ walletAddress })),
    attemptXerberusTool<unknown>("get_positions", () => xerberusService.getPositions({ walletAddress }))
  ]);
  const ladderSteps = liquidityLadderFrom(ladder.data);
  const debtDetected = hasDebtPosition(positionRows.data);

  const scenarioInputs = [
    { id: "eth_drop_40", scenario: "eth_drop_40", label: "What if ETH drops 40%?" },
    { id: "usdc_depeg", scenario: "usdc_depeg", label: "What if USDC depegs?" },
  ];

  const scenarioAttempts = ladderSteps.length > 0 || ladder.warning
    ? [] as Array<ToolAttempt<StressScenarioResponse>>
    : await Promise.all(scenarioInputs.map((scenario) => attemptXerberusTool<StressScenarioResponse>(
      `simulate_scenario:${scenario.scenario}`,
      () => xerberusService.simulateScenario({ walletAddress, scenario: scenario.scenario })
    )));
  const crowding = debtDetected
    ? await withSoftTimeout(
      attemptXerberusTool<CrowdingQueueResponse>("crowding_queue", () => xerberusService.getCrowdingQueue({ walletAddress })),
      4_000,
      { warning: "Crowding queue details are temporarily unavailable." }
    )
    : {} as ToolAttempt<CrowdingQueueResponse>;

  const successes = [...scenarioAttempts.map((attempt) => attempt.data), ladder.data, positionRows.data, crowding.data].filter((data) => data !== undefined).length;
  const warnings = [
    ...scenarioAttempts.map((attempt) => attempt.warning),
    ladder.warning,
    positionRows.warning,
    crowding.warning
  ].filter((warning): warning is string => Boolean(warning));

  if (successes === 0) {
    return unavailableResult(emptyStressTestingResult(), warnings);
  }

  const scenarios = scenarioAttempts
    .map((attempt, index) => scenarioFrom(scenarioInputs[index].id, scenarioInputs[index].label, attempt.data))
    .filter((scenario): scenario is StressScenario => Boolean(scenario && (scenario.portfolioDrawdownPercent > 0 || scenario.systemicRiskAfterShock > 0 || scenario.impactSummary !== "Scenario analysis completed.")));
  if (scenarios.length === 0 && ladderSteps.length === 0 && !crowding.data?.rank && !crowding.data?.summary) {
    return unavailableResult(emptyStressTestingResult(), warnings.length ? warnings : ["Stress testing outputs are temporarily unavailable."]);
  }
  const ladderMetrics = stressMetricsFromLadder(ladder.data, ladderSteps);
  const maxSystemicRisk = Math.max(ladderMetrics.panicMeter, ...scenarios.map((scenario) => scenario.systemicRiskAfterShock));

  return liveResult<StressTestingResult>({
    headline: scenarios.length > 0 ? "Stress scenarios are available for review." : ladderMetrics.headline,
    panicMeter: clamp(maxSystemicRisk),
    downsideExposureUsd: ladderMetrics.downsideExposureUsd,
    liquidationBufferPercent: debtDetected ? 0 : 100,
    crowdingQueueRank: crowding.data?.rank ?? crowding.data?.summary ?? (debtDetected ? "Queue details unavailable" : "No levered debt detected"),
    downsideTiming: crowding.data?.summary ?? ladderMetrics.downsideTiming,
    scenarios,
    exitLiquidityLadder: ladderSteps
  }, ladderSteps.length > 0 ? [] : warnings);
}

export async function getContagionWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyContagionMap());
  }

  if (!walletAddress) {
    return unavailableResult(emptyContagionMap(), ["Select or analyze a wallet to view contagion paths."]);
  }

  const positionProfile = await getPositionProfile(walletAddress);

  if (positionProfile.positions.length === 0) {
    return unavailableResult(emptyContagionMap(), positionProfile.warnings.length > 0 ? positionProfile.warnings : ["No live portfolio exposure graph is available for this wallet yet."]);
  }

  return liveResult<ContagionMap>(contagionMapFromPositions({
    ...emptyWalletAnalysis(walletAddress),
    positions: positionProfile.positions
  }));
}

export async function getPanicOutflowWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyPanicOutflowResult());
  }

  if (!walletAddress) {
    return unavailableResult(emptyPanicOutflowResult(), ["Select or analyze a wallet to scan panic and outflow signals."]);
  }

  const [portfolio, stress] = await Promise.all([
    getWalletAnalysisWithXerberus(walletAddress),
    getExitLadderStress(walletAddress)
  ]);

  if (portfolio.source === "unavailable" && stress.data.exitLiquidityLadder.length === 0) {
    return unavailableResult(emptyPanicOutflowResult(), uniqueStrings([...portfolio.warnings, ...stress.warnings]));
  }

  const derived = panicEventsFromPortfolioAndStress(portfolio.data, stress.data);

  if (derived.data.events.length === 0 && derived.data.panicMeter === 0) {
    return unavailableResult(emptyPanicOutflowResult(), ["No live panic or outflow signals are available for this wallet yet."]);
  }

  return liveResult(derived.data, derived.warnings);
}

export async function getBeautifulOutputsWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyBeautifulOutputsResult());
  }

  if (!walletAddress) {
    return unavailableResult(emptyBeautifulOutputsResult(), ["Select or analyze a wallet to generate outputs."]);
  }

  const [report, portfolio] = await Promise.all([
    attemptXerberusTool<ReportResponse>("generate_report", () => xerberusService.generateReport({
      walletAddress,
      kind: "entity",
      metadata: {
        format: "json",
        includeCharts: false,
        returnHtml: false
      }
    })),
    getWalletAnalysisWithXerberus(walletAddress)
  ]);

  if (!report.data || payloadHasError(report.data)) {
    if (portfolio.source === "unavailable") {
      return unavailableResult(emptyBeautifulOutputsResult(), portfolio.warnings);
    }

    const highestRiskPosition = [...portfolio.data.positions].sort((left, right) => {
      const leftRisk = Math.max(left.systemicRisk, left.intrinsicRisk);
      const rightRisk = Math.max(right.systemicRisk, right.intrinsicRisk);
      return rightRisk - leftRisk;
    })[0];

    return liveResult<BeautifulOutputsResult>({
      reportStatus: "queued",
      generatedAt: new Date().toISOString(),
      artifacts: [
        {
          id: "wallet-risk-brief-preview",
          title: "Wallet Risk Brief Preview",
          description: `Current wallet rating is ${portfolio.data.rating} with an overall risk score of ${portfolio.data.overallRiskScore}/100.`,
          status: "ready",
          kind: "alert"
        },
        {
          id: "risk-visual-summary",
          title: "Risk Visual Summary",
          description: `Intrinsic risk ${portfolio.data.intrinsicRisk}/100 and systemic risk ${portfolio.data.systemicRisk}/100 are ready for presentation.`,
          status: "ready",
          kind: "chart"
        },
        ...(highestRiskPosition ? [{
          id: "top-position-alert",
          title: "Top Position Alert",
          description: `${highestRiskPosition.protocol} / ${highestRiskPosition.asset} is the highest-risk returned position at ${Math.max(highestRiskPosition.intrinsicRisk, highestRiskPosition.systemicRisk)}/100.`,
          status: "ready" as const,
          kind: "alert" as const
        }] : [])
      ],
      ratingDriftAlerts: portfolio.data.rating === "NR" ? [] : [
        {
          id: "wallet-rating-state",
          protocol: "Wallet risk state",
          from: "NR",
          to: portfolio.data.rating,
          severity: outputSeverityFromScore(portfolio.data.overallRiskScore),
          summary: `Current wallet rating is ${portfolio.data.rating}; no historical drift window was returned in this scan.`,
          detectedAt: new Date().toISOString()
        }
      ],
      disclaimer: "Not financial advice."
    });
  }

  const reportRecord = isRecord(report.data) ? report.data : {};
  const status = report.data.status === "generated" || stringFrom(reportRecord.status) === "generated" ? "generated" : "queued";

  return liveResult<BeautifulOutputsResult>({
    reportId: report.data.reportId ?? stringFrom(reportRecord.report_id) ?? stringFrom(reportRecord.id),
    reportUrl: report.data.url ?? stringFrom(reportRecord.url) ?? stringFrom(reportRecord.href),
    reportStatus: status,
    generatedAt: new Date().toISOString(),
    artifacts: [
      {
        id: "output_pdf",
        title: "PDF Risk Report",
        description: "Wallet risk state, stress results, panic signals, and top attention items prepared as a polished report.",
        status: status === "generated" ? "ready" : "queued",
        kind: "pdf",
        href: report.data.url
      }
    ],
    ratingDriftAlerts: [],
    disclaimer: "Not financial advice."
  }, []);
}

export async function buildChatGroundingContext(question: string, walletAddress?: string) {
  if (!walletAddress) {
    return {
      question,
      portfolioRiskContext: emptyWalletAnalysis(),
      intrinsicRiskContext: [] as Array<{
        protocol: string;
        intrinsicRisk: number;
        reason: string;
      }>,
      systemicRiskContext: {
        portfolioSystemicRisk: 0,
        contagionPath: [] as string[]
      },
      stressTestingContext: emptyStressTestingResult(),
      panicOutflowContext: [] as RiskMigrationEvent[],
      smartMoneyContext: [] as Array<{
        label: string;
        recentMove: string;
        exposureChangePercent: number;
        confidence: number;
      }>,
      source: "unavailable" as const,
      warnings: ["Analyze a wallet to give the Co-Pilot live risk context."]
    };
  }

  const [portfolio, stress] = await Promise.all([
    getWalletAnalysisWithXerberus(walletAddress),
    getExitLadderStress(walletAddress)
  ]);
  const contagion = portfolio.source === "unavailable"
    ? emptyContagionMap()
    : contagionMapFromPositions(portfolio.data);
  const panic = panicEventsFromPortfolioAndStress(portfolio.data, stress.data);

  const source = sourceFor((portfolio.source === "xerberus" || portfolio.source === "mixed" || stress.data.exitLiquidityLadder.length > 0) ? 1 : 0);
  const warnings = source === "unavailable"
    ? uniqueStrings([...portfolio.warnings, ...stress.warnings])
    : [];

  return {
    question,
    portfolioRiskContext: portfolio.data,
    intrinsicRiskContext: portfolio.data.positions.map((position) => ({
      protocol: position.protocol,
      intrinsicRisk: position.intrinsicRisk,
      reason: position.mainRiskReason
    })),
    systemicRiskContext: {
      portfolioSystemicRisk: portfolio.data.systemicRisk,
      contagionPath: contagion.highestRiskPath
    },
    stressTestingContext: stress.data,
    panicOutflowContext: panic.data.events,
    smartMoneyContext: [] as Array<{
      label: string;
      recentMove: string;
      exposureChangePercent: number;
      confidence: number;
    }>,
    source,
    warnings
  };
}
