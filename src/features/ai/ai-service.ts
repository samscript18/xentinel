import { GeminiProvider } from "@/features/ai/providers/gemini";
import { GroqProvider } from "@/features/ai/providers/groq";
import { OpenRouterProvider } from "@/features/ai/providers/openrouter";
import type { AiCompletionRequest, AiCompletionResponse, AiProviderName } from "@/types/ai";

const providerFactories = {
  openrouter: () => new OpenRouterProvider(),
  groq: () => new GroqProvider(),
  gemini: () => new GeminiProvider()
} satisfies Record<AiProviderName, () => { complete: (request: AiCompletionRequest) => Promise<AiCompletionResponse> }>;

const providerOrder: AiProviderName[] = ["openrouter", "groq", "gemini"];

function getProviderChain() {
  const configuredProvider = process.env.AI_PROVIDER?.toLowerCase() as AiProviderName | undefined;
  const ordered = configuredProvider && providerOrder.includes(configuredProvider)
    ? [configuredProvider, ...providerOrder.filter((provider) => provider !== configuredProvider)]
    : providerOrder;

  return ordered.map((provider) => providerFactories[provider]());
}

export async function completeWithFallback(request: AiCompletionRequest) {
  const providers = getProviderChain();
  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      return await provider.complete(request);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error("Unknown AI provider error");
      console.warn("[ai]", `${provider.name} failed; trying next provider.`, normalizedError.message);
      errors.push(normalizedError);
    }
  }

  throw new AggregateError(errors, "All AI providers failed.");
}
