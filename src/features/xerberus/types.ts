import type { RiskRating } from "@/types/risk";

export type XerberusRating = RiskRating;

export type XerberusToolName =
  | "rate_token"
  | "rate_market"
  | "rate_entity"
  | "screen"
  | "get_portfolio_brief"
  | "get_failure_modes"
  | "intrinsic_open_risks"
  | "get_intrinsic_summary"
  | "portfolio_intrinsic_posture"
  | "common_cause"
  | "look_through"
  | "risk_decomposition"
  | "infrastructure_risk"
  | "backing_composition"
  | "liquidity_exit_quote"
  | "liquidity_exit"
  | "portfolio_ladder"
  | "simulate_scenario"
  | "crowding_queue"
  | "get_positions"
  | "get_health"
  | "rating_history"
  | "rating_outlook"
  | "generate_report"
  | "watch_create"
  | `chart_${string}`;

export type XerberusTransportMode = "api" | "mcp";
export type XerberusMcpServer = "enterprise" | "framework";

export interface XerberusConfig {
  isConfigured: boolean;
  server: XerberusMcpServer;
  apiKey?: string;
  baseUrl?: string;
  mcpUrl?: string;
  transportMode: XerberusTransportMode;
}

export interface XerberusToolRequest<TInput extends Record<string, unknown> = Record<string, unknown>> {
  tool: XerberusToolName;
  input: TInput;
  server?: XerberusMcpServer;
  timeoutMs?: number;
}

export interface XerberusToolResponse<TData = unknown> {
  tool: XerberusToolName;
  data: TData;
  raw: unknown;
  source: "xerberus";
}

export interface XerberusJsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: "tools/call" | "tools/list";
  params?: {
    name: XerberusToolName;
    arguments: Record<string, unknown>;
  };
}

export interface XerberusToolDefinition {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface RatingRequestInput {
  chain?: string;
  address?: string;
  symbol?: string;
  marketId?: string;
  entityId?: string;
  walletAddress?: string;
  wallets?: string[];
  entity?: string;
  targets?: string[];
  kind?: "token" | "market" | "entity";
  metadata?: Record<string, unknown>;
}

export interface ScreenRequestInput {
  positions: Array<{
    protocol?: string;
    asset?: string;
    chain?: string;
    address?: string;
    valueUsd?: number;
  }>;
}

export interface RatingResponse {
  rating?: XerberusRating;
  score?: number;
  intrinsicRisk?: number;
  systemicRisk?: number;
  confidence?: number;
  reasons: string[];
  raw?: unknown;
}

export interface IntrinsicRiskResponse {
  risks: Array<{
    title: string;
    severity?: "low" | "medium" | "high" | "critical";
    description?: string;
  }>;
  raw?: unknown;
}

export interface SystemicRiskResponse {
  summary?: string;
  score?: number;
  dependencies: Array<{
    name: string;
    category?: string;
    exposure?: number;
  }>;
  raw?: unknown;
}

export interface StressScenarioInput {
  walletAddress?: string;
  wallets?: string[];
  scenario: "eth_drop_40" | "usdc_depeg" | "liquidity_crunch" | string;
  positions?: unknown[];
}

export interface StressScenarioResponse {
  scenario: string;
  drawdownPercent?: number;
  systemicRiskAfterShock?: number;
  summary?: string;
  raw?: unknown;
}

export interface PortfolioLadderResponse {
  steps: Array<{
    window: string;
    exitablePercent?: number;
    expectedSlippagePercent?: number;
    note?: string;
  }>;
  raw?: unknown;
}

export interface CrowdingQueueResponse {
  rank?: string;
  percentile?: number;
  summary?: string;
  raw?: unknown;
}

export interface ReportResponse {
  reportId?: string;
  url?: string;
  status?: "queued" | "generated" | "failed";
  raw?: unknown;
}

export interface WatchResponse {
  watchId?: string;
  status?: "created" | "pending" | "disabled";
  raw?: unknown;
}

export interface XerberusRouteResult<TData> {
  data: TData;
  source: "xerberus" | "mixed" | "unavailable";
  status?: "live" | "loading" | "unavailable";
  warnings: string[];
}
