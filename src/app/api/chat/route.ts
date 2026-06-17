import { NextResponse, type NextRequest } from "next/server";
import { completeWithFallback } from "@/features/ai/ai-service";
import { buildRiskContextPrompt, XENTINEL_COPILOT_SYSTEM_PROMPT } from "@/features/ai/xentinel-copilot";
import { buildChatGroundingContext } from "@/features/xerberus/services/xerberus-route-service";
import type { ChatResponse } from "@/types/api";

interface ChatRequest {
  message?: string;
  walletAddress?: string;
}

function unavailableMessage() {
  return "I do not have enough live portfolio context to answer that responsibly yet. Run a wallet analysis once live risk intelligence is available, then ask again for a position-specific risk view. Not financial advice.";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const question = body.message ?? "What should I monitor first?";
  const groundingContext = await buildChatGroundingContext(question, body.walletAddress);
  const warnings = [...groundingContext.warnings];
  let provider: ChatResponse["data"]["provider"] = {
    name: "xentinel",
    model: "safe-response",
    usedFallback: true
  };
  let content = unavailableMessage();

  try {
    if (groundingContext.source === "unavailable") {
      throw new Error("Live risk context unavailable.");
    }

    const completion = await completeWithFallback({
      messages: [
        {
          role: "system",
          content: XENTINEL_COPILOT_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildRiskContextPrompt(groundingContext)
        }
      ],
      temperature: 0.22
    });

    provider = {
      name: completion.provider,
      model: completion.model,
      usedFallback: false
    };
    content = completion.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("[ai]", "Co-Pilot returned safe response mode.", message);
    warnings.push(
      groundingContext.source === "unavailable"
        ? "Run a wallet analysis when live risk intelligence is available."
        : "Analyst response is temporarily unavailable. Please try again."
    );
  }

  const response: ChatResponse = {
    data: {
      message: {
        id: `chat_${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString()
      },
      contextSignals: [
        `Portfolio rating: ${groundingContext.portfolioRiskContext.rating}`,
        `Panic events tracked: ${groundingContext.panicOutflowContext.length}`,
        `Stress panic meter: ${groundingContext.stressTestingContext.panicMeter}/100`
      ],
      provider
    },
    meta: {
      generatedAt: new Date().toISOString(),
      source: groundingContext.source,
      warnings
    }
  };

  return NextResponse.json(response);
}

export async function GET() {
  const response: ChatResponse = {
    data: {
      message: {
        id: "chat_initial",
        role: "assistant",
        content: "Ask a risk question to start the Co-Pilot.",
        createdAt: new Date().toISOString()
      },
      contextSignals: [
        "Wallet analysis context appears after a portfolio review",
        "Panic and outflow context appears after a risk scan",
        "Ask a question to start the Co-Pilot"
      ],
      provider: {
        name: "xentinel",
        model: "safe-response",
        usedFallback: true
      }
    },
    meta: {
      generatedAt: new Date().toISOString(),
      source: "unavailable",
      warnings: ["Ask a question to start the Co-Pilot."]
    }
  };

  return NextResponse.json(response);
}
