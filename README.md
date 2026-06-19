# Xentinel

**AI-Powered DeFi Risk Co-Pilot + Smart Money Sentinel**

**Know your risk. Watch the smart money. Stay ahead of the panic.**

Xentinel is a DeFi risk intelligence command center built for the **Vibe Buildathon DeFi Track**. It helps users move from a wallet address to practical risk insight: portfolio risk, stress-test pressure, smart-money comparison, panic/outflow signals, dependency paths, and AI explanations.

## Problem

Most DeFi users discover risk too late.

Positions can look healthy until liquidity changes, ratings deteriorate, protocol dependencies weaken, or experienced wallets start rotating away. Existing dashboards often show balances and raw data, but they rarely answer the questions users actually ask:

- Is my money exposed right now?
- What happens if the market breaks?
- Are smart wallets exiting?
- Which position should I pay attention to first?

## Solution

Xentinel turns live risk intelligence into a daily-usable decision layer.

The core journey is:

```txt
Paste Wallet
-> Analyze Portfolio
-> Stress Test Positions
-> Compare Smart Money
-> Detect Panic Signals
-> Ask AI Co-Pilot
-> Generate Insights
```

The product is designed to feel like a premium Web3 risk console: dark, data-dense, responsive, and polished enough for live judging.

## Features

### Portfolio Guardian

Analyze a wallet and surface:

- Overall risk score
- AAA-D style rating
- Intrinsic risk
- Systemic risk
- Position-level risk when returned by the risk engine
- Highest-risk position
- Risk distribution visuals

### Stress Testing Engine

Answer market-break questions:

- What if exits crowd?
- How quickly can this wallet unwind?
- What is the downside timing?
- How much of the wallet can exit in 1 day, 7 days, and 30 days?

### Smart Money Sentinel

Track a server-side watchlist of high-signal wallets and compare:

- Current smart-wallet risk ratings
- Recent risk-score changes
- Notable movements
- Your portfolio risk vs smart-money average
- Whether you are outperforming, lagging, or moving in line

Users can add their own favorite wallets without authentication or signatures.

### Panic / Outflow Detector

Connect portfolio risk and exit pressure into early-warning signals:

- Panic meter
- Highest-risk live position
- Exit-liquidity pressure
- Rating-state alerts
- Smart-money comparison context

### Contagion Radar

Show how risk can travel through DeFi:

- Asset -> protocol -> wallet exposure paths
- Position dependency graph
- Highest-risk path
- Exposure relationships using React Flow

### AI Chat Co-Pilot

Ask natural-language risk questions:

- Is my portfolio safe right now?
- Which position worries you most?
- Are smart wallets exiting anything?
- What happens if a dependency breaks?

The Co-Pilot uses portfolio, stress, panic, smart-money, and contagion context when available.

### Beautiful Outputs

Prepare shareable risk intelligence:

- Wallet risk brief preview
- Risk visual summary
- Top position alert
- Rating-state alert
- Report surface ready for downloadable reports when the live report tool returns an artifact URL

## Xerberus Integration

Xentinel is powered primarily by **Xerberus Enterprise MCP** for live DeFi risk intelligence.

Xerberus enables the product because it exposes the risk primitives Xentinel needs:

- Wallet and entity ratings
- Token and market ratings
- Intrinsic risk
- Systemic risk
- Portfolio ladder / exit liquidity
- Stress scenario tooling
- Risk decomposition and dependency intelligence
- Report and watch tooling where enabled by key tier

Xentinel uses Xerberus as the primary risk engine, then normalizes responses into user-facing product modules. If a tool is unavailable, slow, or not enabled for the current key, Xentinel shows an honest unavailable or preview state instead of fabricating holdings or pretending data is live.


## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment:

```bash
cp .env.example .env.local
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment Variables

MONGODB_URI=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
SMART_WALLET_WATCHLIST=...
XERBERUS_API_KEY=...
XERBERUS_ENTERPRISE_API_KEY=...
XERBERUS_ENTERPRISE_MCP_URL=https://mcp.xerberus.io/enterprise/mcp
XERBERUS_FRAMEWORK_API_KEY=...
XERBERUS_FRAMEWORK_MCP_URL=https://mcp.xerberus.io/framework/mcp
AI_PROVIDER=...
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
GEMINI_API_KEY=...

## Demo Flow

1. Open `/`.
2. Explain the positioning: Xentinel is an AI-powered DeFi risk Co-Pilot + Smart Money Sentinel.
3. Launch `/dashboard`.
4. Open **Portfolio Guardian**.
5. Use one of the example wallets to run a wallet analysis.
6. Open **Stress Testing Engine** to inspect exit timing and panic pressure.
7. Open **Smart Money Sentinel** to compare the selected wallet against the smart-wallet average.
8. Open **Panic / Outflow Detector** to review early-warning signals.
9. Open **Contagion Radar** to show exposure paths.
10. Ask the **AI Chat Co-Pilot**: “Which position worries you most?”
11. Open **Beautiful Outputs** to show the risk brief preview and alert cards.

## Verification

```bash
npm run typecheck
npm run build
```

## Deployment Notes

- Use server-only env vars for Xerberus, MongoDB, and AI provider keys.
- Do not expose secret keys with `NEXT_PUBLIC_`.
- Configure `NEXT_PUBLIC_SITE_URL` to the production URL.
- Configure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for wallet connection.
- Confirm MongoDB network access from the deployment platform.
- Confirm Xerberus key tier supports the tools needed for the live demo.
- Confirm the deployment runtime can reach Xerberus MCP without an upstream challenge. If Vercel logs show a `403` response containing `Just a moment...` or `challenges.cloudflare.com`, the request is being blocked before MCP JSON-RPC handling. Ask Xerberus to allow server-to-server access from the deployment environment or provide a non-challenged server endpoint.

## Known Limitations

- Downloadable reports require Xerberus `generate_report` to return a usable report artifact URL. Until then, Xentinel shows a live wallet-derived risk brief preview.
- Some Xerberus tools can be slow or unavailable depending on key tier, tool freshness, or wallet coverage. Xentinel keeps module-level unavailable states instead of creating fake data.
- Production deployments depend on Xerberus MCP accepting requests from the hosting provider. Xentinel detects upstream challenge pages and falls back to unavailable states instead of exposing raw provider errors.
- Wallet connect is non-custodial and does not request signatures; it only supplies the connected address for analysis.

## Disclaimer

Xentinel is for risk intelligence and education. It is not financial advice.
