import "server-only";
import { getXerberusConfig } from "@/features/xerberus/config";
import type {
  XerberusJsonRpcRequest,
  XerberusToolName,
  XerberusToolRequest,
  XerberusToolResponse
} from "@/features/xerberus/types";

export class XerberusClientError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "timeout" | "http_error" | "invalid_response" | "network_error",
    readonly status?: number
  ) {
    super(message);
    this.name = "XerberusClientError";
  }
}

function getEndpointUrl() {
  const config = getXerberusConfig();

  if (!config.isConfigured) {
    throw new XerberusClientError("Xerberus is not configured.", "not_configured");
  }

  const rootUrl = config.mcpUrl ?? config.baseUrl;

  if (!rootUrl) {
    throw new XerberusClientError("Xerberus endpoint is missing.", "not_configured");
  }

  return rootUrl.replace(/\/$/, "");
}

function parseMaybeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseStreamableHttpResponse(text: string): unknown {
  const dataLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s*/, ""));

  if (dataLines.length > 0) {
    return parseMaybeJson(dataLines[dataLines.length - 1] ?? "{}");
  }

  return parseMaybeJson(text);
}

function unwrapMcpContent(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }

  const record = raw as Record<string, unknown>;

  if (record.error) {
    throw new XerberusClientError("Xerberus MCP returned an error.", "invalid_response");
  }

  const result = record.result;

  if (typeof result !== "object" || result === null) {
    return record.data ?? record.output ?? raw;
  }

  const resultRecord = result as Record<string, unknown>;
  const content = resultRecord.content;

  if (Array.isArray(content) && content.length > 0) {
    const first = content[0] as Record<string, unknown>;

    if (typeof first.text === "string") {
      return parseMaybeJson(first.text);
    }

    return first;
  }

  return resultRecord.data ?? resultRecord.output ?? result;
}

function normalizePayload<TData>(tool: XerberusToolName, raw: unknown): XerberusToolResponse<TData> {
  if (typeof raw !== "object" || raw === null) {
    throw new XerberusClientError("Xerberus returned a non-object response.", "invalid_response");
  }

  const data = unwrapMcpContent(raw) as TData;

  return {
    tool,
    data,
    raw,
    source: "xerberus"
  };
}

export async function callXerberusTool<TInput extends Record<string, unknown>, TData = unknown>(
  request: XerberusToolRequest<TInput>
): Promise<XerberusToolResponse<TData>> {
  const config = getXerberusConfig();
  const endpointUrl = getEndpointUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  // TODO: Validate this raw tools/call envelope with a live Xerberus key.
  // The docs show Streamable HTTP MCP + SDK call_tool usage, but not a raw
  // tool-call HTTP example beyond JSON-RPC tools/list.
  const jsonRpcRequest: XerberusJsonRpcRequest = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: request.tool,
      arguments: request.input
    }
  };

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "x-api-key": config.apiKey ?? "",
        "x-xentinel-tool": request.tool
      },
      body: JSON.stringify(jsonRpcRequest),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new XerberusClientError("Xerberus request failed.", "http_error", response.status);
    }

    const text = await response.text();
    const raw = parseStreamableHttpResponse(text);

    return normalizePayload<TData>(request.tool, raw);
  } catch (error) {
    if (error instanceof XerberusClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new XerberusClientError("Xerberus request timed out.", "timeout");
    }

    throw new XerberusClientError("Xerberus network request failed.", "network_error");
  } finally {
    clearTimeout(timeout);
  }
}
