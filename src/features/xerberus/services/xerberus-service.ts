import "server-only";
import { callXerberusTool, listXerberusTools } from "@/features/xerberus/services/xerberus-client";
import type {
  CrowdingQueueResponse,
  IntrinsicRiskResponse,
  PortfolioLadderResponse,
  RatingRequestInput,
  RatingResponse,
  ReportResponse,
  ScreenRequestInput,
  StressScenarioInput,
  StressScenarioResponse,
  SystemicRiskResponse,
  WatchResponse,
  XerberusMcpServer,
  XerberusToolName
} from "@/features/xerberus/types";

type ToolInput = Record<string, unknown>;
const primaryRatingTimeoutMs = 8_000;
const progressiveSectionTimeoutMs = 8_000;
const stressTimeoutMs = 12_000;

function asToolInput(input: object): ToolInput {
  return input as ToolInput;
}

function metadataNumber(input: RatingRequestInput | StressScenarioInput, key: string) {
  const value = "metadata" in input ? input.metadata?.[key] : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compactRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return true;
    })
  );
}

function walletList(input: Pick<RatingRequestInput | StressScenarioInput, "walletAddress" | "wallets">) {
  return input.wallets?.length ? input.wallets : input.walletAddress ? [input.walletAddress] : undefined;
}

function entityIdentifier(input: RatingRequestInput) {
  return input.entity ?? input.entityId ?? input.walletAddress ?? input.address ?? input.symbol ?? input.marketId ?? "";
}

function entityPayload(input: RatingRequestInput) {
  return compactRecord({
    entity: entityIdentifier(input),
    chain: input.chain,
    window: input.metadata?.window
  });
}

function tokenPayload(input: RatingRequestInput) {
  return compactRecord({
    token: input.symbol ?? input.address ?? input.entityId,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function marketPayload(input: RatingRequestInput) {
  return compactRecord({
    market_uid: input.marketId ?? input.address ?? input.entityId ?? input.symbol,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function subjectIdentifier(input: RatingRequestInput) {
  return input.metadata?.subject ?? input.symbol ?? input.entity ?? input.entityId ?? input.address ?? input.walletAddress ?? input.marketId ?? "";
}

function subjectPayload(input: RatingRequestInput) {
  return compactRecord({
    subject: subjectIdentifier(input),
    chain: input.chain,
    window: input.metadata?.window
  });
}

function walletPortfolioPayload(input: RatingRequestInput) {
  return compactRecord({
    wallets: walletList(input),
    chain: input.chain,
    window: input.metadata?.window
  });
}

function infrastructurePayload(input: RatingRequestInput) {
  return compactRecord({
    node: input.metadata?.node ?? input.entity ?? input.entityId ?? input.symbol ?? input.address ?? input.walletAddress,
    top_n: metadataNumber(input, "topN"),
    chain: input.chain,
    window: input.metadata?.window
  });
}

function backingPayload(input: RatingRequestInput) {
  return compactRecord({
    token: input.symbol ?? input.address ?? input.entityId ?? input.walletAddress,
    entity: input.entity ?? input.entityId,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function screenPayload(input: ScreenRequestInput) {
  const targets = input.positions
    .map((position) => position.address ?? position.asset ?? position.protocol)
    .filter((target): target is string => typeof target === "string" && target.trim().length > 0)
    .slice(0, 50);

  return compactRecord({
    targets,
    kind: "token",
    chain: input.positions.find((position) => position.chain)?.chain
  });
}

function scenarioPayload(input: StressScenarioInput) {
  const wallets = walletList(input);
  const base = {
    wallets,
    chain: undefined,
    expand_dependents: true
  };

  if (input.scenario === "eth_drop_40") {
    return compactRecord({
      ...base,
      shocks: [{ token: "ETH", drop_pct: 40 }]
    });
  }

  if (input.scenario === "usdc_depeg" || input.scenario === "stablecoin_contagion") {
    return compactRecord({
      ...base,
      preset: "usdc_depeg"
    });
  }

  if (input.scenario === "liquidity_crunch") {
    return compactRecord({
      ...base,
      preset: "ftx"
    });
  }

  return compactRecord({
    ...base,
    preset: input.scenario
  });
}

function portfolioLadderPayload(input: RatingRequestInput) {
  return compactRecord({
    wallets: walletList(input),
    impact_pct: metadataNumber(input, "impactPct") ?? 1,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function crowdingQueuePayload(input: RatingRequestInput) {
  return compactRecord({
    wallet: input.walletAddress ?? input.wallets?.[0],
    token: input.symbol ?? input.address,
    position_usd: metadataNumber(input, "positionUsd"),
    stress_drop_pct: metadataNumber(input, "stressDropPct") ?? 10,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function reportPayload(input: RatingRequestInput) {
  return compactRecord({
    subject: subjectIdentifier(input),
    kind: input.kind ?? input.metadata?.kind,
    format: input.metadata?.format,
    include_charts: input.metadata?.includeCharts,
    return_html: input.metadata?.returnHtml,
    chain: input.chain
  });
}

function positionsPayload(input: RatingRequestInput) {
  return compactRecord({
    wallet: input.walletAddress ?? input.wallets?.[0],
    chain: input.chain,
    window: input.metadata?.window
  });
}

function ratingHistoryPayload(input: RatingRequestInput) {
  return compactRecord({
    target: input.metadata?.target ?? entityIdentifier(input),
    kind: input.kind ?? input.metadata?.kind ?? "entity",
    windows: metadataNumber(input, "windows"),
    chain: input.chain
  });
}

function liquidityExitQuotePayload(input: RatingRequestInput) {
  return compactRecord({
    token: input.symbol ?? input.address ?? input.entityId,
    usd_notional: metadataNumber(input, "usdNotional") ?? metadataNumber(input, "positionUsd"),
    impact_pct: metadataNumber(input, "impactPct") ?? 1,
    chain: input.chain,
    window: input.metadata?.window
  });
}

function watchPayload(input: RatingRequestInput) {
  return compactRecord({
    wallets: walletList(input),
    entity: input.entity ?? input.entityId ?? input.walletAddress,
    chain: input.chain,
    conditions: input.metadata?.conditions
  });
}

async function callTool<TInput extends object, TResponse>(
  tool: XerberusToolName,
  input: TInput,
  options: { timeoutMs?: number } = {}
) {
  return callXerberusTool<ToolInput, TResponse>({
    tool,
    input: asToolInput(input),
    timeoutMs: options.timeoutMs
  });
}

export const xerberusService = {
  listTools(server?: XerberusMcpServer) {
    return listXerberusTools(server);
  },

  rateToken(input: RatingRequestInput) {
    return callTool<ToolInput, RatingResponse>("rate_token", tokenPayload(input), { timeoutMs: primaryRatingTimeoutMs });
  },

  rateMarket(input: RatingRequestInput) {
    return callTool<ToolInput, RatingResponse>("rate_market", marketPayload(input), { timeoutMs: primaryRatingTimeoutMs });
  },

  rateEntity(input: RatingRequestInput) {
    return callTool<ToolInput, RatingResponse>("rate_entity", entityPayload(input), { timeoutMs: primaryRatingTimeoutMs });
  },

  screen(input: ScreenRequestInput) {
    return callTool<ToolInput, RatingResponse[]>("screen", screenPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getPortfolioBrief(input: RatingRequestInput) {
    return callTool<ToolInput, RatingResponse>("get_portfolio_brief", walletPortfolioPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getIntrinsicOpenRisks(input: RatingRequestInput) {
    return callTool<ToolInput, IntrinsicRiskResponse>("intrinsic_open_risks", subjectPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getIntrinsicSummary(input: RatingRequestInput) {
    return callTool<ToolInput, IntrinsicRiskResponse>("get_intrinsic_summary", subjectPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getPortfolioIntrinsicPosture(input: RatingRequestInput) {
    return callTool<ToolInput, IntrinsicRiskResponse>("portfolio_intrinsic_posture", walletPortfolioPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getRiskDecomposition(input: RatingRequestInput) {
    return callTool<ToolInput, SystemicRiskResponse>("risk_decomposition", entityPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getLookThrough(input: RatingRequestInput) {
    return callTool<ToolInput, SystemicRiskResponse>("look_through", walletPortfolioPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getCommonCause(input: RatingRequestInput) {
    return callTool<ToolInput, SystemicRiskResponse>("common_cause", walletPortfolioPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getInfrastructureRisk(input: RatingRequestInput) {
    return callTool<ToolInput, SystemicRiskResponse>("infrastructure_risk", infrastructurePayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getBackingComposition(input: RatingRequestInput) {
    return callTool<ToolInput, SystemicRiskResponse>("backing_composition", backingPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getPositions(input: RatingRequestInput) {
    return callTool<ToolInput, unknown>("get_positions", positionsPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getHealth(input: RatingRequestInput) {
    return callTool<ToolInput, unknown>("get_health", positionsPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getRatingHistory(input: RatingRequestInput) {
    return callTool<ToolInput, unknown>("rating_history", ratingHistoryPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getRatingOutlook(input: RatingRequestInput) {
    return callTool<ToolInput, unknown>("rating_outlook", ratingHistoryPayload(input), { timeoutMs: progressiveSectionTimeoutMs });
  },

  getPortfolioLadder(input: RatingRequestInput) {
    return callTool<ToolInput, PortfolioLadderResponse>("portfolio_ladder", portfolioLadderPayload(input), { timeoutMs: stressTimeoutMs });
  },

  simulateScenario(input: StressScenarioInput) {
    return callTool<ToolInput, StressScenarioResponse>("simulate_scenario", scenarioPayload(input), { timeoutMs: stressTimeoutMs });
  },

  getCrowdingQueue(input: RatingRequestInput) {
    return callTool<ToolInput, CrowdingQueueResponse>("crowding_queue", crowdingQueuePayload(input), { timeoutMs: stressTimeoutMs });
  },

  getLiquidityExitQuote(input: RatingRequestInput) {
    return callTool<ToolInput, unknown>("liquidity_exit_quote", liquidityExitQuotePayload(input), { timeoutMs: stressTimeoutMs });
  },

  generateReport(input: RatingRequestInput) {
    return callTool<ToolInput, ReportResponse>("generate_report", reportPayload(input));
  },

  createWatch(input: RatingRequestInput) {
    return callTool<ToolInput, WatchResponse>("watch_create", watchPayload(input));
  }
};
