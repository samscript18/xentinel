export type RiskRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C" | "D" | "NR";

export type RiskTrend = "improving" | "stable" | "deteriorating";

export interface RiskScoreBreakdown {
  overallRiskScore: number;
  intrinsicRisk: number;
  systemicRisk: number;
  rating: RiskRating;
  trend: RiskTrend;
}

export interface PortfolioPosition {
  protocol: string;
  asset: string;
  chain: string;
  valueUsd: number;
  allocationPercent: number;
  rating: RiskRating;
  intrinsicRisk: number;
  systemicRisk: number;
  mainRiskReason: string;
}

export interface WalletAnalysis extends RiskScoreBreakdown {
  id: string;
  walletAddress: string;
  analyzedAt: string;
  positions: PortfolioPosition[];
}

export interface RiskMigrationEvent {
  id: string;
  protocol: string;
  oldRating: RiskRating;
  newRating: RiskRating;
  confidence: number;
  timestamp: string;
  signal: string;
  severity: "low" | "medium" | "high";
  timeframe: string;
  reason: string;
  smartWalletMovement: string;
  downgradeProbability: number;
}

export interface ContagionNode {
  id: string;
  label: string;
  rating: RiskRating;
  exposureUsd: number;
  category: "Protocol" | "Asset" | "User";
}

export interface ContagionEdge {
  id: string;
  source: string;
  target: string;
  dependency: string;
  weight: number;
}

export interface ContagionMap {
  nodes: ContagionNode[];
  edges: ContagionEdge[];
  highestRiskPath: string[];
}

export interface SmartWallet {
  id: string;
  walletAddress: string;
  label: string;
  performanceScore: number;
  currentRiskRating: RiskRating;
  allocationShift: string;
  lastMovementAt: string;
  recentMove: string;
  exposureChangePercent: number;
  confidence: number;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface StressScenario {
  id: string;
  name: string;
  impactSummary: string;
  portfolioDrawdownPercent: number;
  systemicRiskAfterShock: number;
  severity: "moderate" | "high" | "critical";
}

export interface LiquidityLadderStep {
  window: string;
  exitablePercent: number;
  expectedSlippagePercent: number;
  note: string;
}

export interface StressTestingResult {
  headline: string;
  panicMeter: number;
  downsideExposureUsd: number;
  liquidationBufferPercent: number;
  crowdingQueueRank: string;
  downsideTiming: string;
  scenarios: StressScenario[];
  exitLiquidityLadder: LiquidityLadderStep[];
}

export interface OutputArtifact {
  id: string;
  title: string;
  description: string;
  status: "ready" | "queued" | "unavailable";
  kind: "pdf" | "chart" | "alert";
  href?: string;
}

export interface RatingDriftAlert {
  id: string;
  protocol: string;
  from: RiskRating;
  to: RiskRating;
  severity: "medium" | "high" | "critical";
  summary: string;
  detectedAt: string;
}

export interface BeautifulOutputsResult {
  reportId?: string;
  reportUrl?: string;
  reportStatus: "generated" | "queued" | "unavailable";
  generatedAt: string;
  artifacts: OutputArtifact[];
  ratingDriftAlerts: RatingDriftAlert[];
  disclaimer: string;
}
