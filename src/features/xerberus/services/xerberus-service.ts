import "server-only";
import { callXerberusTool } from "@/features/xerberus/services/xerberus-client";
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
  XerberusToolName
} from "@/features/xerberus/types";

type ToolInput = Record<string, unknown>;

function asToolInput(input: object): ToolInput {
  return input as ToolInput;
}

async function callTool<TInput extends object, TResponse>(
  tool: XerberusToolName,
  input: TInput
) {
  return callXerberusTool<ToolInput, TResponse>({
    tool,
    input: asToolInput(input)
  });
}

export const xerberusService = {
  rateToken(input: RatingRequestInput) {
    return callTool<RatingRequestInput, RatingResponse>("rate_token", input);
  },

  rateMarket(input: RatingRequestInput) {
    return callTool<RatingRequestInput, RatingResponse>("rate_market", input);
  },

  rateEntity(input: RatingRequestInput) {
    return callTool<RatingRequestInput, RatingResponse>("rate_entity", input);
  },

  screen(input: ScreenRequestInput) {
    return callTool<ScreenRequestInput, RatingResponse[]>("screen", input);
  },

  getIntrinsicOpenRisks(input: RatingRequestInput) {
    return callTool<RatingRequestInput, IntrinsicRiskResponse>("get_failure_modes", input);
  },

  getRiskDecomposition(input: RatingRequestInput) {
    return callTool<RatingRequestInput, SystemicRiskResponse>("look_through", input);
  },

  getInfrastructureRisk(input: RatingRequestInput) {
    return callTool<RatingRequestInput, SystemicRiskResponse>("infrastructure_risk", input);
  },

  getBackingComposition(input: RatingRequestInput) {
    return callTool<RatingRequestInput, SystemicRiskResponse>("backing_composition", input);
  },

  getPortfolioLadder(input: RatingRequestInput) {
    return callTool<RatingRequestInput, PortfolioLadderResponse>("liquidity_exit_quote", input);
  },

  simulateScenario(input: StressScenarioInput) {
    return callTool<StressScenarioInput, StressScenarioResponse>("simulate_scenario", input);
  },

  getCrowdingQueue(input: RatingRequestInput) {
    return callTool<RatingRequestInput, CrowdingQueueResponse>("crowding_queue", input);
  },

  generateReport(input: RatingRequestInput) {
    return callTool<RatingRequestInput, ReportResponse>("generate_report", input);
  },

  createWatch(input: RatingRequestInput) {
    return callTool<RatingRequestInput, WatchResponse>("watch_create", input);
  }
};
