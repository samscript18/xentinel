import { AiProviderError, HttpAiProvider } from "@/features/ai/providers/base";
import type { AiCompletionRequest, AiCompletionResponse } from "@/types/ai";

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class GroqProvider extends HttpAiProvider {
  readonly name = "groq" as const;
  protected readonly apiKeyEnv = "GROQ_API_KEY";
  protected readonly modelEnv = "GROQ_MODEL";
  protected readonly defaultModel = "llama-3.1-8b-instant";

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const json = await this.fetchJson("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.requireApiKey()}`
      },
      body: JSON.stringify({
        model: request.model ?? this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.25
      })
    }) as GroqChatResponse;

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new AiProviderError("Groq response did not include message content.", this.name, "invalid_response");
    }

    return {
      provider: this.name,
      model: request.model ?? this.model,
      content
    };
  }
}
