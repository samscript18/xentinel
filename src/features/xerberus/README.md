# Xerberus MCP Integration Layer

This folder contains Xentinel's server-only adapter for Xerberus.

Xentinel uses Xerberus Enterprise MCP as the primary live risk intelligence source. Core product APIs do not require Moralis or another wallet-ingestion provider. If Xerberus returns wallet positions or exposure records, Xentinel normalizes them for the dashboard; if it does not, the UI shows wallet-level analysis without inventing positions.

Xentinel does not require switching a global environment variable between Xerberus products at runtime. Configure both MCP credentials in deployment if both are available, then call Enterprise or Framework explicitly from server-side code. The current product APIs default to Enterprise because they power live wallet, systemic-risk, stress, contagion, exit, monitoring, and report flows.

## What the docs say

The public Xerberus MCP page documents the Risk Framework MCP:

- Endpoint: `https://mcp.xerberus.io/framework/mcp`
- Transport: Streamable HTTP MCP
- Auth header: `X-API-Key: <key>`
- Example request for discovery: JSON-RPC `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`

The Enterprise MCP page is the relevant surface for Xentinel's live systemic-risk use case:

- Endpoint: `https://mcp.xerberus.io/enterprise/mcp`
- Health endpoint: `https://mcp.xerberus.io/enterprise/health`
- Transport: Streamable HTTP MCP
- Auth header: `x-api-key: <key>`
- SDK example: `ClientSession.call_tool("rate_token", {"token": "USDC"})`
- Tool output: JSON; chart tools return PNG blocks.
- Responses include `data_window` and `is_stale` where applicable.
- Write-tier tools include `watch_create` and `generate_report`.
- The Streamable HTTP endpoint is stateful: initialize first, capture the `mcp-session-id` response header, send `notifications/initialized`, then include `mcp-session-id` on `tools/call`.

## Tool mapping

Xentinel exposes product-friendly service methods. Where the requested product method name differs from the documented Enterprise tool name, the adapter maps to the nearest documented tool:

| Xentinel method | MCP tool used | Note |
| --- | --- | --- |
| `rateToken` | `rate_token` | Documented |
| `rateMarket` | `rate_market` | Documented |
| `rateEntity` | `rate_entity` | Documented |
| `screen` | `screen` | Documented |
| `getPortfolioBrief` | `get_portfolio_brief` | Documented Enterprise wallet brief tool |
| `getIntrinsicOpenRisks` | `get_failure_modes` | `intrinsic_open_risks` was not found in docs |
| `getRiskDecomposition` | `look_through` | `risk_decomposition` was not found in docs |
| `getInfrastructureRisk` | `infrastructure_risk` | Documented |
| `getBackingComposition` | `backing_composition` | Documented |
| `getPortfolioLadder` | `portfolio_ladder` | Documented Enterprise wallet exit ladder |
| `simulateScenario` | `simulate_scenario` | Documented |
| `getCrowdingQueue` | `crowding_queue` | Documented |
| `generateReport` | `generate_report` | Documented, write tier |
| `createWatch` | `watch_create` | Documented, write tier |

## Request shape

The docs show `tools/list` JSON-RPC directly and tool calls via SDK. This adapter uses the standard MCP JSON-RPC tool call shape:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "rate_token",
    "arguments": { "token": "USDC" }
  }
}
```

The Xentinel client initializes a Streamable HTTP MCP session, sends the initialized notification, then calls tools through the standard JSON-RPC `tools/call` envelope.

## Unavailable State

If live risk intelligence is not configured, the request fails, the key lacks permissions, or the response is unexpected, routes return typed empty payloads with `meta.source = "unavailable"` and a neutral warning.

No API keys are exposed to the browser.
