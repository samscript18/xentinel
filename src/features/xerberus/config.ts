import "server-only";
import type { XerberusConfig, XerberusMcpServer } from "@/features/xerberus/types";

const defaultEnterpriseMcpUrl = "https://mcp.xerberus.io/enterprise/mcp";
const defaultFrameworkMcpUrl = "https://mcp.xerberus.io/framework/mcp";

export function getXerberusConfig(server: XerberusMcpServer = "enterprise"): XerberusConfig {
	const apiKey = server === "framework"
		? process.env.XERBERUS_FRAMEWORK_API_KEY
		: process.env.XERBERUS_ENTERPRISE_API_KEY ?? process.env.XERBERUS_API_KEY;
	const selectedUrl = server === "framework"
		? process.env.XERBERUS_FRAMEWORK_MCP_URL ?? defaultFrameworkMcpUrl
		: process.env.XERBERUS_ENTERPRISE_MCP_URL ?? process.env.XERBERUS_MCP_URL ?? process.env.XERBERUS_BASE_URL ?? defaultEnterpriseMcpUrl;

	return {
		isConfigured: Boolean(apiKey && selectedUrl),
		server,
		apiKey,
		baseUrl: process.env.XERBERUS_BASE_URL,
		mcpUrl: selectedUrl,
		transportMode: "mcp",
	};
}
