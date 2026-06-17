import "server-only";
import { getWalletPortfolio } from "@/features/moralis/moralis-client";
import type { MoralisDefiPosition, MoralisPortfolio, MoralisTokenHolding } from "@/features/moralis/types";
import { getSmartMoneyLive } from "@/features/smart-money/services/smart-money-service";
import { getXerberusConfig } from "@/features/xerberus/config";
import { xerberusService } from "@/features/xerberus/services/xerberus-service";
import { logXerberusWarning } from "@/features/xerberus/utils/xerberus-logger";
import type {
  CrowdingQueueResponse,
  IntrinsicRiskResponse,
  PortfolioLadderResponse,
  RatingResponse,
  ReportResponse,
  StressScenarioResponse,
  SystemicRiskResponse,
  XerberusRouteResult
} from "@/features/xerberus/types";
import type {
  BeautifulOutputsResult,
  ContagionMap,
  ContagionNode,
  LiquidityLadderStep,
  RiskMigrationEvent,
  RiskRating,
  StressScenario,
  StressTestingResult,
  WalletAnalysis
} from "@/types/risk";

const validRatings: RiskRating[] = ["AAA", "AA", "A", "BBB", "BB", "B", "C", "D"];

interface ToolAttempt<TData> {
  data?: TData;
  warning?: string;
}

const unavailableWarning = "Live risk intelligence is not available yet.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function ratingFrom(value: unknown): RiskRating | undefined {
  return typeof value === "string" && validRatings.includes(value as RiskRating)
    ? value as RiskRating
    : undefined;
}

function trendFrom(score: number | undefined) {
  if (score === undefined) {
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

function sourceFor(successes: number): XerberusRouteResult<unknown>["source"] {
  return successes > 0 ? "xerberus" : "unavailable";
}

function unavailableResult<TData>(data: TData, warnings: string[] = []): XerberusRouteResult<TData> {
  return {
    data,
    source: "unavailable",
    warnings: uniqueStrings([unavailableWarning, ...warnings])
  };
}

function liveResult<TData>(data: TData, warnings: string[] = []): XerberusRouteResult<TData> {
  return {
    data,
    source: warnings.length > 0 ? "mixed" : "xerberus",
    warnings: uniqueStrings(warnings)
  };
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
      warning: `${label} is temporarily unavailable.`
    };
  }
}

async function attemptMoralisPortfolio(walletAddress: string): Promise<ToolAttempt<MoralisPortfolio>> {
  try {
    return { data: await getWalletPortfolio(walletAddress) };
  } catch (error) {
    logXerberusWarning("Moralis wallet portfolio ingestion failed.", error);
    return {
      warning: "Wallet portfolio ingestion is temporarily unavailable."
    };
  }
}

function emptyWalletAnalysis(walletAddress = ""): WalletAnalysis {
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

function emptyStressTestingResult(): StressTestingResult {
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

function emptyContagionMap(): ContagionMap {
  return {
    nodes: [],
    edges: [],
    highestRiskPath: []
  };
}

function emptyPanicOutflowResult() {
  return {
    events: [] as RiskMigrationEvent[],
    panicMeter: 0,
    outflowSignals: [] as string[],
    ratingDriftSignals: [] as string[],
    systemicRiskSpikeIndicators: [] as string[],
    smartWalletExitComparison: "No live smart-money comparison available yet."
  };
}

function emptyBeautifulOutputsResult(): BeautifulOutputsResult {
  return {
    reportStatus: "unavailable",
    generatedAt: new Date().toISOString(),
    artifacts: [],
    ratingDriftAlerts: [],
    disclaimer: "Not financial advice."
  };
}

function normalizeRatingResponse(response: unknown) {
  if (!isRecord(response)) {
    return {};
  }

  return {
    rating: ratingFrom(response.rating ?? response.grade),
    score: numberFrom(response.score ?? response.riskScore ?? response.overallRiskScore),
    intrinsicRisk: numberFrom(response.intrinsicRisk ?? response.intrinsic_risk),
    systemicRisk: numberFrom(response.systemicRisk ?? response.systemic_risk),
    trend: stringFrom(response.trend),
    reasons: Array.isArray(response.reasons)
      ? response.reasons.filter((reason): reason is string => typeof reason === "string")
      : []
  };
}

function normalizeScreenRatings(response: unknown) {
  if (Array.isArray(response)) {
    return response.map(normalizeRatingResponse);
  }

  if (isRecord(response) && Array.isArray(response.results)) {
    return response.results.map(normalizeRatingResponse);
  }

  return [];
}

function intrinsicRiskReasons(response: IntrinsicRiskResponse | undefined) {
  if (!response || !Array.isArray(response.risks)) {
    return [];
  }

  return response.risks
    .map((risk) => risk.description ?? risk.title)
    .filter((reason): reason is string => typeof reason === "string" && reason.length > 0);
}

function systemicDependencies(response: SystemicRiskResponse | undefined) {
  if (!response || !Array.isArray(response.dependencies)) {
    return [];
  }

  return response.dependencies
    .map((dependency) => ({
      name: dependency.name,
      category: dependency.category,
      exposure: dependency.exposure
    }))
    .filter((dependency) => dependency.name);
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

function scenarioFrom(id: string, name: string, response: StressScenarioResponse | undefined): StressScenario | undefined {
  if (!response) {
    return undefined;
  }

  const drawdown = clamp(numberFrom(response.drawdownPercent) ?? 0);
  const systemicRisk = clamp(numberFrom(response.systemicRiskAfterShock) ?? 0);

  return {
    id,
    name,
    impactSummary: response.summary ?? "Scenario analysis completed.",
    portfolioDrawdownPercent: drawdown,
    systemicRiskAfterShock: systemicRisk,
    severity: severityFrom(systemicRisk)
  };
}

function liquidityLadderFrom(response: PortfolioLadderResponse | undefined): LiquidityLadderStep[] {
  if (!response || !Array.isArray(response.steps)) {
    return [];
  }

  return response.steps.map((step) => ({
    window: step.window,
    exitablePercent: clamp(step.exitablePercent ?? 0),
    expectedSlippagePercent: Math.max(0, step.expectedSlippagePercent ?? 0),
    note: step.note ?? "Exit ladder step."
  }));
}

function dependencyNode(dependency: ReturnType<typeof systemicDependencies>[number], index: number): ContagionNode {
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

function defiPositionLabel(position: MoralisDefiPosition) {
  return position.protocolName;
}

function tokenPositionLabel(token: MoralisTokenHolding) {
  return token.name === token.symbol ? token.symbol : `${token.name} (${token.symbol})`;
}

function portfolioPositionsFrom(portfolio: MoralisPortfolio, screenData: unknown, systemicScore?: number) {
  const screenRatings = normalizeScreenRatings(screenData);
  const combined = [
    ...portfolio.defiPositions.map((position) => ({
      protocol: defiPositionLabel(position),
      asset: position.asset,
      chain: position.chain,
      valueUsd: position.valueUsd,
      address: position.positionAddress ?? position.tokenAddresses[0],
      category: position.category
    })),
    ...portfolio.tokenHoldings.map((token) => ({
      protocol: token.nativeToken ? token.symbol : tokenPositionLabel(token),
      asset: token.symbol,
      chain: token.chain,
      valueUsd: token.usdValue,
      address: token.tokenAddress,
      category: "token"
    }))
  ].sort((a, b) => b.valueUsd - a.valueUsd);
  const total = combined.reduce((sum, position) => sum + position.valueUsd, 0);

  return combined.map((position, index) => {
    const rating = screenRatings[index];

    return {
      protocol: position.protocol,
      asset: position.asset,
      chain: position.chain,
      valueUsd: Math.round(position.valueUsd),
      allocationPercent: total > 0 ? Math.round((position.valueUsd / total) * 100) : 0,
      rating: rating?.rating ?? "NR",
      intrinsicRisk: clamp(rating?.intrinsicRisk ?? 0),
      systemicRisk: clamp(rating?.systemicRisk ?? systemicScore ?? 0),
      mainRiskReason: rating?.reasons?.[0] ?? `${position.category} exposure discovered from live wallet data.`
    };
  });
}

async function getPortfolioForRisk(walletAddress?: string) {
  if (!walletAddress) {
    return undefined;
  }

  const result = await attemptMoralisPortfolio(walletAddress);
  return result.data;
}

export async function getWalletAnalysisWithXerberus(walletAddress = "") {
  const portfolio = await attemptMoralisPortfolio(walletAddress);

  if (!portfolio.data) {
    return unavailableResult(emptyWalletAnalysis(walletAddress), portfolio.warning ? [portfolio.warning] : []);
  }

  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyWalletAnalysis(walletAddress));
  }

  const screenPositions = [
    ...portfolio.data.defiPositions.map((position) => ({
      protocol: position.protocolName,
      asset: position.asset,
      chain: position.chain,
      address: position.positionAddress ?? position.tokenAddresses[0],
      valueUsd: position.valueUsd
    })),
    ...portfolio.data.tokenHoldings.map((token) => ({
      protocol: token.name,
      asset: token.symbol,
      chain: token.chain,
      address: token.tokenAddress,
      valueUsd: token.usdValue
    }))
  ].slice(0, 50);

  const [entity, screen, intrinsic, systemic] = await Promise.all([
    attemptXerberusTool<RatingResponse>("rate_entity", () => xerberusService.rateEntity({ walletAddress })),
    attemptXerberusTool<RatingResponse[]>("screen", () => xerberusService.screen({ positions: screenPositions })),
    attemptXerberusTool<IntrinsicRiskResponse>("intrinsic_open_risks", () => xerberusService.getIntrinsicOpenRisks({ walletAddress })),
    attemptXerberusTool<SystemicRiskResponse>("risk_decomposition", () => xerberusService.getRiskDecomposition({ walletAddress }))
  ]);

  const successes = [entity.data, screen.data, intrinsic.data, systemic.data].filter((data) => data !== undefined).length;
  const warnings = [portfolio.warning, entity.warning, screen.warning, intrinsic.warning, systemic.warning].filter((warning): warning is string => Boolean(warning));

  if (successes === 0) {
    return unavailableResult(emptyWalletAnalysis(walletAddress), warnings);
  }

  const entityRating = normalizeRatingResponse(entity.data);
  const systemicScore = numberFrom(systemic.data?.score);
  const positions = portfolioPositionsFrom(portfolio.data, screen.data, systemicScore);
  const intrinsicAverage = positions.length > 0 ? positions.reduce((sum, position) => sum + position.intrinsicRisk, 0) / positions.length : 0;
  const systemicAverage = positions.length > 0 ? positions.reduce((sum, position) => sum + position.systemicRisk, 0) / positions.length : 0;
  const score = clamp(entityRating.score ?? systemicScore ?? systemicAverage);

  return liveResult<WalletAnalysis>({
    id: "analysis_live",
    walletAddress,
    overallRiskScore: score,
    intrinsicRisk: clamp(entityRating.intrinsicRisk ?? intrinsicAverage),
    systemicRisk: clamp(entityRating.systemicRisk ?? systemicScore ?? systemicAverage),
    rating: entityRating.rating ?? "NR",
    trend: entityRating.trend === "improving" || entityRating.trend === "deteriorating" ? entityRating.trend : trendFrom(score),
    analyzedAt: new Date().toISOString(),
    positions
  }, warnings);
}

export async function getStressTestingWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyStressTestingResult());
  }

  const portfolio = await getPortfolioForRisk(walletAddress);
  const positions = portfolio ? [
    ...portfolio.defiPositions.map((position) => ({
      protocol: position.protocolName,
      asset: position.asset,
      chain: position.chain,
      valueUsd: position.valueUsd,
      address: position.positionAddress ?? position.tokenAddresses[0]
    })),
    ...portfolio.tokenHoldings.map((token) => ({
      protocol: token.name,
      asset: token.symbol,
      chain: token.chain,
      valueUsd: token.usdValue,
      address: token.tokenAddress
    }))
  ] : undefined;

  const scenarioInputs = [
    { id: "eth_drop_40", scenario: "eth_drop_40", label: "What if ETH drops 40%?" },
    { id: "usdc_depeg", scenario: "usdc_depeg", label: "What if USDC depegs?" },
    { id: "liquidity_crunch", scenario: "liquidity_crunch", label: "What if liquidity dries up?" },
    { id: "stablecoin_contagion", scenario: "stablecoin_contagion", label: "What if stablecoin contagion spreads?" }
  ];

  const [scenarioAttempts, ladder, crowding] = await Promise.all([
    Promise.all(scenarioInputs.map((scenario) => attemptXerberusTool<StressScenarioResponse>(
      `simulate_scenario:${scenario.scenario}`,
      () => xerberusService.simulateScenario({ walletAddress, scenario: scenario.scenario, positions })
    ))),
    attemptXerberusTool<PortfolioLadderResponse>("portfolio_ladder", () => xerberusService.getPortfolioLadder({ walletAddress })),
    attemptXerberusTool<CrowdingQueueResponse>("crowding_queue", () => xerberusService.getCrowdingQueue({ walletAddress }))
  ]);

  const successes = [...scenarioAttempts.map((attempt) => attempt.data), ladder.data, crowding.data].filter((data) => data !== undefined).length;
  const warnings = [
    ...scenarioAttempts.map((attempt) => attempt.warning),
    ladder.warning,
    crowding.warning
  ].filter((warning): warning is string => Boolean(warning));

  if (successes === 0) {
    return unavailableResult(emptyStressTestingResult(), warnings);
  }

  const scenarios = scenarioAttempts
    .map((attempt, index) => scenarioFrom(scenarioInputs[index].id, scenarioInputs[index].label, attempt.data))
    .filter((scenario): scenario is StressScenario => Boolean(scenario));
  const maxSystemicRisk = Math.max(0, ...scenarios.map((scenario) => scenario.systemicRiskAfterShock));
  const maxDrawdown = Math.max(0, ...scenarios.map((scenario) => scenario.portfolioDrawdownPercent));
  const ladderSteps = liquidityLadderFrom(ladder.data);

  return liveResult<StressTestingResult>({
    headline: scenarios.length > 0 ? "Stress scenarios are available for review." : "Exit and crowding data are available for review.",
    panicMeter: clamp(maxSystemicRisk),
    downsideExposureUsd: maxDrawdown,
    liquidationBufferPercent: 0,
    crowdingQueueRank: crowding.data?.rank ?? crowding.data?.summary ?? "No crowding queue rank available",
    downsideTiming: crowding.data?.summary ?? "Review the liquidity ladder for downside timing.",
    scenarios,
    exitLiquidityLadder: ladderSteps
  }, warnings);
}

export async function getContagionWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyContagionMap());
  }

  const [riskDecomposition, infrastructure, backing] = await Promise.all([
    attemptXerberusTool<SystemicRiskResponse>("risk_decomposition", () => xerberusService.getRiskDecomposition({ walletAddress })),
    attemptXerberusTool<SystemicRiskResponse>("infrastructure_risk", () => xerberusService.getInfrastructureRisk({ walletAddress })),
    attemptXerberusTool<SystemicRiskResponse>("backing_composition", () => xerberusService.getBackingComposition({ walletAddress }))
  ]);

  const successes = [riskDecomposition.data, infrastructure.data, backing.data].filter((data) => data !== undefined).length;
  const warnings = [riskDecomposition.warning, infrastructure.warning, backing.warning].filter((warning): warning is string => Boolean(warning));

  if (successes === 0) {
    return unavailableResult(emptyContagionMap(), warnings);
  }

  const dependencyRecords = uniqueStrings([
    ...systemicDependencies(riskDecomposition.data).map((dependency) => dependency.name),
    ...systemicDependencies(infrastructure.data).map((dependency) => dependency.name),
    ...systemicDependencies(backing.data).map((dependency) => dependency.name)
  ]).map((name, index) => dependencyNode({ name, category: undefined, exposure: undefined }, index));
  const nodes: ContagionNode[] = [
    ...dependencyRecords,
    { id: "wallet", label: "Your Position", rating: "NR", exposureUsd: 0, category: "User" }
  ];
  const edges = dependencyRecords.map((node, index) => ({
    id: `dependency_edge_${index}`,
    source: node.id,
    target: "wallet",
    dependency: "Systemic dependency",
    weight: 0.58 + index * 0.08
  }));

  return liveResult<ContagionMap>({
    nodes,
    edges,
    highestRiskPath: dependencyRecords.length > 0 ? [...dependencyRecords.map((node) => node.label), "Your Position"] : []
  }, warnings);
}

export async function getPanicOutflowWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyPanicOutflowResult());
  }

  const [riskDecomposition, infrastructure] = await Promise.all([
    attemptXerberusTool<SystemicRiskResponse>("risk_decomposition", () => xerberusService.getRiskDecomposition({ walletAddress, entityId: walletAddress ? undefined : "xentinel-portfolio" })),
    attemptXerberusTool<SystemicRiskResponse>("infrastructure_risk", () => xerberusService.getInfrastructureRisk({ walletAddress, entityId: walletAddress ? undefined : "xentinel-portfolio" }))
  ]);
  const smartMoney = await getSmartMoneyLive().catch(() => ({ wallets: [], source: "unavailable" as const, warnings: [] as string[] }));
  const warnings = [riskDecomposition.warning, infrastructure.warning].filter((warning): warning is string => Boolean(warning));
  const successes = [riskDecomposition.data, infrastructure.data].filter((data) => data !== undefined).length;

  if (successes === 0) {
    return unavailableResult(emptyPanicOutflowResult(), warnings);
  }

  const systemicScore = clamp(numberFrom(riskDecomposition.data?.score) ?? 0);
  const infrastructureSummary = stringFrom(infrastructure.data?.summary);
  const dependencyNames = systemicDependencies(riskDecomposition.data).map((dependency) => dependency.name);
  const exitWallets = smartMoney.wallets.filter((wallet) => wallet.exposureChangePercent < 0);
  const events: RiskMigrationEvent[] = [
    ...(infrastructureSummary ? [{
      id: "infrastructure-risk-change",
      protocol: "Infrastructure",
      oldRating: "NR" as RiskRating,
      newRating: "NR" as RiskRating,
      confidence: 0.7,
      timestamp: new Date().toISOString(),
      signal: infrastructureSummary,
      severity: systemicScore >= 75 ? "high" as const : "medium" as const,
      timeframe: "Current",
      reason: infrastructureSummary,
      smartWalletMovement: exitWallets.length > 0 ? `${exitWallets.length} tracked wallet exposure reductions detected.` : "No tracked wallet exit signal detected.",
      downgradeProbability: systemicScore
    }] : []),
    ...exitWallets.map((wallet) => ({
      id: `smart-wallet-exit-${wallet.id}`,
      protocol: wallet.label,
      oldRating: "NR" as RiskRating,
      newRating: wallet.currentRiskRating,
      confidence: wallet.confidence,
      timestamp: wallet.lastMovementAt,
      signal: wallet.recentMove,
      severity: Math.abs(wallet.exposureChangePercent) >= 25 ? "high" as const : "medium" as const,
      timeframe: "Since previous snapshot",
      reason: wallet.recentMove,
      smartWalletMovement: wallet.recentMove,
      downgradeProbability: clamp(Math.abs(wallet.exposureChangePercent))
    }))
  ];

  return liveResult({
    events,
    panicMeter: systemicScore,
    outflowSignals: exitWallets.map((wallet) => wallet.recentMove),
    ratingDriftSignals: [],
    systemicRiskSpikeIndicators: dependencyNames,
    smartWalletExitComparison: exitWallets.length > 0
      ? `${exitWallets.length} tracked wallet exposure reductions detected.`
      : "No tracked smart-wallet exit signal detected."
  }, warnings);
}

export async function getBeautifulOutputsWithXerberus(walletAddress?: string) {
  if (!getXerberusConfig().isConfigured) {
    return unavailableResult(emptyBeautifulOutputsResult());
  }

  const report = await attemptXerberusTool<ReportResponse>("generate_report", () => xerberusService.generateReport({
    walletAddress,
    metadata: {
      product: "Xentinel",
      reportType: "wallet-risk",
      includeStressTesting: true,
      includePanicOutflows: true,
      includeContagion: true
    }
  }));

  if (!report.data) {
    return unavailableResult(emptyBeautifulOutputsResult(), report.warning ? [report.warning] : []);
  }

  const status = report.data.status === "generated" ? "generated" : "queued";

  return liveResult<BeautifulOutputsResult>({
    reportId: report.data.reportId,
    reportUrl: report.data.url,
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
  const [portfolio, stress, contagion, panic] = await Promise.all([
    getWalletAnalysisWithXerberus(walletAddress),
    getStressTestingWithXerberus(walletAddress),
    getContagionWithXerberus(walletAddress),
    getPanicOutflowWithXerberus(walletAddress)
  ]);

  const sources = [portfolio.source, stress.source, contagion.source, panic.source];
  const source = sourceFor(sources.filter((item) => item === "xerberus" || item === "mixed").length);

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
      contagionPath: contagion.data.highestRiskPath
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
    warnings: uniqueStrings([...portfolio.warnings, ...stress.warnings, ...contagion.warnings, ...panic.warnings])
  };
}
