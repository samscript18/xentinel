import "server-only";
import type { XerberusConfig } from "@/features/xerberus/types";

const DEFAULT_ENTERPRISE_MCP_URL = "https://mcp.xerberus.io/enterprise/mcp";
const DEFAULT_FRAMEWORK_MCP_URL = "https://mcp.xerberus.io/framework/mcp";

export function getXerberusConfig(): XerberusConfig {
  const baseUrl = process.env.XERBERUS_BASE_URL;
  const mode = process.env.XERBERUS_MCP_MODE === "framework" ? "framework" : "enterprise";
  const apiKey = mode === "framework"
    ? process.env.XERBERUS_FRAMEWORK_API_KEY ?? process.env.XERBERUS_API_KEY
    : process.env.XERBERUS_ENTERPRISE_API_KEY ?? process.env.XERBERUS_API_KEY;
  const selectedUrl = mode === "framework"
    ? process.env.XERBERUS_FRAMEWORK_MCP_URL ?? DEFAULT_FRAMEWORK_MCP_URL
    : process.env.XERBERUS_ENTERPRISE_MCP_URL ?? DEFAULT_ENTERPRISE_MCP_URL;
  const mcpUrl = process.env.XERBERUS_MCP_URL ?? baseUrl ?? selectedUrl;

  return {
    isConfigured: Boolean(apiKey && mcpUrl),
    apiKey,
    baseUrl,
    mcpUrl,
    transportMode: "mcp"
  };
}
