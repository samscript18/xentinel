import type {
  ChatMessage,
  BeautifulOutputsResult,
  ContagionMap,
  RiskMigrationEvent,
  RiskRating,
  SmartWallet,
  StressTestingResult,
  WalletAnalysis
} from "@/types/risk";

export type ApiSource = "xerberus" | "mixed" | "unavailable";

export interface ApiResponse<TData> {
  data: TData;
  meta: {
    generatedAt: string;
    source: ApiSource;
    status?: "live" | "loading" | "unavailable";
    warnings?: string[];
  };
}

export type AnalyzeWalletResponse = ApiResponse<WalletAnalysis>;

export type RiskMigrationResponse = ApiResponse<{
  events: RiskMigrationEvent[];
  panicMeter?: number;
  outflowSignals?: string[];
  ratingDriftSignals?: string[];
  systemicRiskSpikeIndicators?: string[];
  smartWalletExitComparison?: string;
}>;

export type ContagionResponse = ApiResponse<ContagionMap>;

export type SmartMoneyResponse = ApiResponse<{
  wallets: SmartWallet[];
  comparison: {
    userRiskScore?: number;
    userRiskRating?: RiskRating;
    smartMoneyAverageRiskScore: number;
    smartMoneyAverageRating?: RiskRating;
    status: "outperforming" | "lagging" | "in_line" | "unavailable";
    summary: string;
  };
}>;

export type StressTestingResponse = ApiResponse<StressTestingResult>;

export type BeautifulOutputsResponse = ApiResponse<BeautifulOutputsResult>;

export type ChatResponse = ApiResponse<{
  message: ChatMessage;
  contextSignals: string[];
  provider: {
    name: "openrouter" | "groq" | "gemini" | "xentinel";
    model: string;
    usedFallback: boolean;
  };
}>;
