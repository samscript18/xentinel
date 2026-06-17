import "server-only";
import type { buildChatGroundingContext } from "@/features/xerberus/services/xerberus-route-service";

type ChatGroundingContext = Awaited<ReturnType<typeof buildChatGroundingContext>>;

export const XENTINEL_COPILOT_SYSTEM_PROMPT = `You are Xentinel's AI Chat Co-Pilot, a senior DeFi risk analyst.

Your job:
- Explain DeFi portfolio risk clearly and practically.
- Use intrinsic risk to describe whether a token/protocol can break on its own.
- Use systemic risk to describe dependency, contagion, infrastructure, and counterparty exposure.
- Reference Portfolio Guardian, Stress Testing Engine, Panic / Outflow Detector, Smart Money Sentinel, and Contagion Radar context when relevant.
- Be calm, direct, and protective. Avoid hype.
- Never guarantee safety and never say "your funds are safe".
- Do not give personalized financial advice. Include "not financial advice" where appropriate.
- Give practical protection ideas such as reducing concentration, checking exit liquidity, monitoring panic/outflow signals, reviewing liquidation buffers, or moving slowly.
- If live context is unavailable, say that clearly and do not invent portfolio facts.
- Keep responses concise but useful: lead with the answer, then give reasons and suggested next checks.
`;

export function buildRiskContextPrompt(context: ChatGroundingContext) {
  return `User question:
${context.question}

Portfolio Guardian:
- Wallet: ${context.portfolioRiskContext.walletAddress}
- Overall risk score: ${context.portfolioRiskContext.overallRiskScore}/100
- Rating: ${context.portfolioRiskContext.rating}
- Intrinsic risk: ${context.portfolioRiskContext.intrinsicRisk}/100
- Systemic risk: ${context.portfolioRiskContext.systemicRisk}/100
- Highest-risk style positions:
${context.portfolioRiskContext.positions
  .map((position) => `  - ${position.protocol}: ${position.rating}, intrinsic ${position.intrinsicRisk}/100, systemic ${position.systemicRisk}/100, reason: ${position.mainRiskReason}`)
  .join("\n")}

Stress Testing Engine:
- Panic meter: ${context.stressTestingContext.panicMeter}/100
- Downside exposure: $${context.stressTestingContext.downsideExposureUsd.toLocaleString()}
- Liquidation buffer: ${context.stressTestingContext.liquidationBufferPercent}%
- Crowding queue: ${context.stressTestingContext.crowdingQueueRank}
- Downside timing: ${context.stressTestingContext.downsideTiming}

Panic / Outflow Detector:
${context.panicOutflowContext
  .map((event) => `  - ${event.protocol}: ${event.oldRating} -> ${event.newRating}, confidence ${Math.round(event.confidence * 100)}%, panic probability ${event.downgradeProbability}%, signal: ${event.signal}, smart money: ${event.smartWalletMovement}`)
  .join("\n")}

Smart Money Sentinel:
${context.smartMoneyContext
  .map((wallet) => `  - ${wallet.label}: ${wallet.recentMove}, exposure change ${wallet.exposureChangePercent}%, confidence ${Math.round(wallet.confidence * 100)}%`)
  .join("\n")}

Contagion / systemic risk:
- Portfolio systemic risk: ${context.systemicRiskContext.portfolioSystemicRisk}/100
- Critical path: ${context.systemicRiskContext.contagionPath.join(" -> ")}

Answer as a senior DeFi risk analyst.`;
}
