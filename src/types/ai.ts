export type AiProviderName = "openrouter" | "groq" | "gemini";

export interface AiCompletionRequest {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
  temperature?: number;
}

export interface AiCompletionResponse {
  provider: AiProviderName;
  model: string;
  content: string;
}

export interface AiProvider {
  readonly name: AiProviderName;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
