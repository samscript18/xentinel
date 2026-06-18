import "server-only";
import axios, { AxiosError } from "axios";
import { getXerberusConfig } from "@/features/xerberus/config";
import type { XerberusJsonRpcRequest, XerberusMcpServer, XerberusToolDefinition, XerberusToolName, XerberusToolRequest, XerberusToolResponse } from "@/features/xerberus/types";

const mcpProtocolVersion = "2025-06-18";

interface McpSession {
	endpointUrl: string;
	apiKey: string;
	sessionId: string;
}

let activeSession: McpSession | undefined;

export class XerberusClientError extends Error {
	constructor(
		message: string,
		readonly code: "not_configured" | "timeout" | "http_error" | "upstream_blocked" | "invalid_response" | "network_error",
		readonly status?: number,
		readonly endpoint?: string,
		readonly detail?: string,
	) {
		super(message);
		this.name = "XerberusClientError";
	}
}

function baseHeaders(config: ReturnType<typeof getXerberusConfig>, tool?: XerberusToolName) {
	return {
		"Content-Type": "application/json",
		Accept: "application/json, text/event-stream",
		"Accept-Language": "en-US,en;q=0.9",
		"User-Agent": "Xentinel/1.0 (+https://xentinel.app; server-to-server MCP client)",
		"x-api-key": config.apiKey ?? "",
		"MCP-Protocol-Version": mcpProtocolVersion,
		...(tool ? { "x-xentinel-tool": tool } : {})
	};
}

function getEndpointUrl(server: XerberusMcpServer = "enterprise") {
	const config = getXerberusConfig(server);

	if (!config.isConfigured) {
		throw new XerberusClientError("Xerberus is not configured.", "not_configured");
	}

	const rootUrl = config.mcpUrl;

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
		throw new XerberusClientError("Xerberus MCP returned an error.", "invalid_response", undefined, undefined, responseDetail(record.error));
	}

	const result = record.result;

	if (typeof result !== "object" || result === null) {
		return record.data ?? record.output ?? raw;
	}

	const resultRecord = result as Record<string, unknown>;
	if (resultRecord.isError === true) {
		throw new XerberusClientError("Xerberus MCP tool returned an error.", "invalid_response", undefined, undefined, responseDetail(resultRecord.content ?? resultRecord));
	}

	const content = resultRecord.content;

	if (Array.isArray(content) && content.length > 0) {
		const first = content[0] as Record<string, unknown>;

		if (typeof first.text === "string") {
			if (/^(Unknown tool|Error executing tool)/i.test(first.text.trim())) {
				throw new XerberusClientError("Xerberus MCP tool returned an error.", "invalid_response", undefined, undefined, first.text.slice(0, 500));
			}

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
		source: "xerberus",
	};
}

async function ensureMcpSession(endpointUrl: string, apiKey: string, server: XerberusMcpServer) {
	if (activeSession?.endpointUrl === endpointUrl && activeSession.apiKey === apiKey) {
		return activeSession.sessionId;
	}

	const config = getXerberusConfig(server);
	const initializeRequest = {
		jsonrpc: "2.0",
		id: Date.now(),
		method: "initialize",
		params: {
			protocolVersion: mcpProtocolVersion,
			capabilities: {},
			clientInfo: {
				name: "xentinel",
				version: "0.1.0"
			}
		}
	};

	try {
		const response = await axios.post<string>(endpointUrl, initializeRequest, {
			headers: baseHeaders(config),
			responseType: "text",
			timeout: 10_000,
			transformResponse: [(data: unknown) => data],
		});
		const sessionId = headerValue(response.headers["mcp-session-id"]);

		if (!sessionId) {
			throw new XerberusClientError("Xerberus MCP initialize did not return a session ID.", "invalid_response", response.status, endpointUrl);
		}

		activeSession = {
			endpointUrl,
			apiKey,
			sessionId
		};

		await sendInitializedNotification(endpointUrl, sessionId, server);

		return sessionId;
	} catch (error) {
		if (error instanceof XerberusClientError) {
			throw error;
		}

		if (axios.isAxiosError(error)) {
			return handleAxiosError(error, endpointUrl);
		}

		throw new XerberusClientError("Xerberus network request failed.", "network_error", undefined, endpointUrl);
	}
}

async function sendInitializedNotification(endpointUrl: string, sessionId: string, server: XerberusMcpServer) {
	const config = getXerberusConfig(server);
	const notification = {
		jsonrpc: "2.0",
		method: "notifications/initialized"
	};

	await axios.post<string>(endpointUrl, notification, {
		headers: {
			...baseHeaders(config),
			"mcp-session-id": sessionId
		},
		responseType: "text",
		timeout: 10_000,
		transformResponse: [(data: unknown) => data],
		validateStatus: (status) => status >= 200 && status < 300
	});
}

function headerValue(value: unknown) {
	if (Array.isArray(value)) {
		return typeof value[0] === "string" ? value[0] : undefined;
	}

	return typeof value === "string" ? value : undefined;
}

export async function callXerberusTool<TInput extends Record<string, unknown>, TData = unknown>(request: XerberusToolRequest<TInput>): Promise<XerberusToolResponse<TData>> {
	const server = request.server ?? "enterprise";
	const config = getXerberusConfig(server);
	const endpointUrl = getEndpointUrl(server);
	const apiKey = config.apiKey ?? "";
	const sessionId = await ensureMcpSession(endpointUrl, apiKey, server);
	// Xerberus uses Streamable HTTP MCP. This raw JSON-RPC envelope mirrors the
	// MCP tool call shape used after session initialization.
	const jsonRpcRequest: XerberusJsonRpcRequest = {
		jsonrpc: "2.0",
		id: Date.now(),
		method: "tools/call",
		params: {
			name: request.tool,
			arguments: request.input,
		},
	};

	try {
		const response = await postToolCallWithRetry<TData>(endpointUrl, sessionId, jsonRpcRequest, request.tool, server, request.timeoutMs);
		return response;
	} catch (error) {
		if (error instanceof XerberusClientError) {
			if (isRecoverableSessionError(error)) {
				activeSession = undefined;
				const nextSessionId = await ensureMcpSession(endpointUrl, apiKey, server);
				const response = await postToolCallWithRetry<TData>(endpointUrl, nextSessionId, jsonRpcRequest, request.tool, server, request.timeoutMs);
				return response;
			}

			throw error;
		}

		if (axios.isAxiosError(error)) {
			const normalizedError = xerberusErrorFromAxios(error, endpointUrl);

			if (isRecoverableSessionError(normalizedError)) {
				activeSession = undefined;
				const nextSessionId = await ensureMcpSession(endpointUrl, apiKey, server);
				const response = await postToolCallWithRetry<TData>(endpointUrl, nextSessionId, jsonRpcRequest, request.tool, server, request.timeoutMs);
				return response;
			}

			throw normalizedError;
		}

		throw new XerberusClientError("Xerberus network request failed.", "network_error");
	}
}

export async function listXerberusTools(server: XerberusMcpServer = "enterprise"): Promise<XerberusToolDefinition[]> {
	const config = getXerberusConfig(server);
	const endpointUrl = getEndpointUrl(server);
	const apiKey = config.apiKey ?? "";
	const sessionId = await ensureMcpSession(endpointUrl, apiKey, server);
	const jsonRpcRequest: XerberusJsonRpcRequest = {
		jsonrpc: "2.0",
		id: Date.now(),
		method: "tools/list",
	};

	try {
		const raw = await postJsonRpc(endpointUrl, sessionId, jsonRpcRequest, undefined, server);
		return normalizeToolsList(raw);
	} catch (error) {
		if (error instanceof XerberusClientError) {
			if (isRecoverableSessionError(error)) {
				activeSession = undefined;
				const nextSessionId = await ensureMcpSession(endpointUrl, apiKey, server);
				const raw = await postJsonRpc(endpointUrl, nextSessionId, jsonRpcRequest, undefined, server);
				return normalizeToolsList(raw);
			}

			throw error;
		}

		if (axios.isAxiosError(error)) {
			const normalizedError = xerberusErrorFromAxios(error, endpointUrl);

			if (isRecoverableSessionError(normalizedError)) {
				activeSession = undefined;
				const nextSessionId = await ensureMcpSession(endpointUrl, apiKey, server);
				const raw = await postJsonRpc(endpointUrl, nextSessionId, jsonRpcRequest, undefined, server);
				return normalizeToolsList(raw);
			}

			throw normalizedError;
		}

		throw new XerberusClientError("Xerberus network request failed.", "network_error");
	}
}

async function postToolCallWithRetry<TData>(
	endpointUrl: string,
	sessionId: string,
	jsonRpcRequest: XerberusJsonRpcRequest,
	tool: XerberusToolName,
	server: XerberusMcpServer,
	timeoutMs?: number
) {
	try {
		return await postToolCall<TData>(endpointUrl, sessionId, jsonRpcRequest, tool, server, timeoutMs);
	} catch (error) {
		const normalizedError = axios.isAxiosError(error) ? xerberusErrorFromAxios(error, endpointUrl) : error;

		if (normalizedError instanceof XerberusClientError && isRetryableXerberusError(normalizedError)) {
			return postToolCall<TData>(endpointUrl, sessionId, jsonRpcRequest, tool, server, timeoutMs);
		}

		throw normalizedError;
	}
}

async function postToolCall<TData>(
	endpointUrl: string,
	sessionId: string,
	jsonRpcRequest: XerberusJsonRpcRequest,
	tool: XerberusToolName,
	server: XerberusMcpServer,
	timeoutMs?: number
) {
	const raw = await postJsonRpc(endpointUrl, sessionId, jsonRpcRequest, tool, server, timeoutMs);

	return normalizePayload<TData>(tool, raw);
}

async function postJsonRpc(endpointUrl: string, sessionId: string, jsonRpcRequest: XerberusJsonRpcRequest, tool: XerberusToolName | undefined, server: XerberusMcpServer, timeoutMs = 10_000) {
	const config = getXerberusConfig(server);
	const response = await axios.post<string>(endpointUrl, jsonRpcRequest, {
		headers: {
			...baseHeaders(config, tool),
			"mcp-session-id": sessionId
		},
		responseType: "text",
		timeout: timeoutMs,
		transformResponse: [(data: unknown) => data],
	});

	const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
	return parseStreamableHttpResponse(text);
}

function normalizeToolsList(raw: unknown): XerberusToolDefinition[] {
	if (typeof raw !== "object" || raw === null) {
		throw new XerberusClientError("Xerberus returned a non-object tools list.", "invalid_response");
	}

	const record = raw as Record<string, unknown>;
	const result = typeof record.result === "object" && record.result !== null ? record.result as Record<string, unknown> : record;
	const tools = Array.isArray(result.tools) ? result.tools : [];

	return tools.flatMap((tool) => {
		if (typeof tool !== "object" || tool === null) {
			return [];
		}

		const toolRecord = tool as Record<string, unknown>;
		const name = typeof toolRecord.name === "string" ? toolRecord.name : undefined;

		if (!name) {
			return [];
		}

		return [{
			name,
			description: typeof toolRecord.description === "string" ? toolRecord.description : undefined,
			inputSchema: toolRecord.inputSchema
		}];
	});
}

function handleAxiosError(error: AxiosError, endpointUrl: string): never {
	throw xerberusErrorFromAxios(error, endpointUrl);
}

function xerberusErrorFromAxios(error: AxiosError, endpointUrl: string) {
	if (error.code === "ECONNABORTED") {
		return new XerberusClientError("Xerberus request timed out.", "timeout", undefined, endpointUrl);
	}

	if (error.response) {
		const detail = responseDetail(error.response.data);
		const code = isCloudflareChallenge(detail) ? "upstream_blocked" : "http_error";
		const message = code === "upstream_blocked"
			? "Xerberus MCP blocked this server runtime before the MCP request could complete."
			: "Xerberus request failed.";

		return new XerberusClientError(message, code, error.response.status, endpointUrl, detail);
	}

	return new XerberusClientError("Xerberus network request failed.", "network_error", undefined, endpointUrl);
}

function isRecoverableSessionError(error: XerberusClientError) {
	const detail = error.detail?.toLowerCase() ?? "";
	return (error.status === 400 || error.status === 404) && detail.includes("session");
}

function isRetryableXerberusError(error: XerberusClientError) {
	return error.code === "network_error" || (error.status !== undefined && error.status >= 500);
}

function responseDetail(data: unknown) {
	if (typeof data === "string") {
		if (isCloudflareChallenge(data)) {
			return "Cloudflare challenge page returned by Xerberus MCP before JSON-RPC handling.";
		}

		return data.slice(0, 500);
	}

	try {
		return JSON.stringify(data).slice(0, 500);
	} catch {
		return undefined;
	}
}

function isCloudflareChallenge(value: string | undefined) {
	if (!value) {
		return false;
	}

	const normalized = value.toLowerCase();
	return normalized.includes("just a moment")
		|| normalized.includes("challenges.cloudflare.com")
		|| normalized.includes("cloudflare");
}
