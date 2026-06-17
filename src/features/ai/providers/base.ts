import "server-only";
import type { AiCompletionRequest, AiCompletionResponse, AiProvider, AiProviderName } from "@/types/ai";

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly provider: AiProviderName,
    readonly code: "missing_key" | "http_error" | "timeout" | "invalid_response" | "network_error",
    readonly status?: number
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export abstract class HttpAiProvider implements AiProvider {
  abstract readonly name: AiProviderName;
  protected abstract readonly apiKeyEnv: string;
  protected abstract readonly modelEnv: string;
  protected abstract readonly defaultModel: string;

  protected get apiKey() {
    return process.env[this.apiKeyEnv];
  }

  protected get model() {
    return process.env[this.modelEnv] ?? this.defaultModel;
  }

  protected requireApiKey() {
    const apiKey = this.apiKey;

    if (!apiKey) {
      throw new AiProviderError("AI provider API key is missing.", this.name, "missing_key");
    }

    return apiKey;
  }

  protected async fetchJson(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new AiProviderError("AI provider request failed.", this.name, "http_error", response.status);
      }

      const json = (await response.json().catch(() => null)) as unknown;

      if (typeof json !== "object" || json === null) {
        throw new AiProviderError("AI provider returned an invalid response.", this.name, "invalid_response");
      }

      return json;
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AiProviderError("AI provider request timed out.", this.name, "timeout");
      }

      throw new AiProviderError("AI provider network request failed.", this.name, "network_error");
    } finally {
      clearTimeout(timeout);
    }
  }

  abstract complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
