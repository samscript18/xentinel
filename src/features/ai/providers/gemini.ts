import { AiProviderError, HttpAiProvider } from "@/features/ai/providers/base";
import type { AiCompletionRequest, AiCompletionResponse } from "@/types/ai";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiProvider extends HttpAiProvider {
  readonly name = "gemini" as const;
  protected readonly apiKeyEnv = "GEMINI_API_KEY";
  protected readonly modelEnv = "GEMINI_MODEL";
  protected readonly defaultModel = "gemini-1.5-flash";

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const apiKey = this.requireApiKey();
    const model = request.model ?? this.model;
    const systemMessage = request.messages.find((message) => message.role === "system")?.content;
    const conversation = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      }));

    const json = await this.fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
          contents: conversation,
          generationConfig: {
            temperature: request.temperature ?? 0.25
          }
        })
      }
    ) as GeminiResponse;

    const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

    if (!content) {
      throw new AiProviderError("Gemini response did not include message content.", this.name, "invalid_response");
    }

    return {
      provider: this.name,
      model,
      content
    };
  }
}
