import { AiProviderError, HttpAiProvider } from "@/features/ai/providers/base";
import type { AiCompletionRequest, AiCompletionResponse } from "@/types/ai";

interface OpenAiCompatibleResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenRouterProvider extends HttpAiProvider {
  readonly name = "openrouter" as const;
  protected readonly apiKeyEnv = "OPENROUTER_API_KEY";
  protected readonly modelEnv = "OPENROUTER_MODEL";
  protected readonly defaultModel = "openai/gpt-4o-mini";

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const json = await this.fetchJson("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.requireApiKey()}`,
        "HTTP-Referer": "https://xentinel.local",
        "X-Title": "Xentinel"
      },
      body: JSON.stringify({
        model: request.model ?? this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.25
      })
    }) as OpenAiCompatibleResponse;

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new AiProviderError("OpenRouter response did not include message content.", this.name, "invalid_response");
    }

    return {
      provider: this.name,
      model: request.model ?? this.model,
      content
    };
  }
}
