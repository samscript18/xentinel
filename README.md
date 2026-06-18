# Xentinel

Xentinel is an AI-powered DeFi Risk Co-Pilot + Smart Money Sentinel built for the Vibe Buildathon DeFi Track.

Tagline: Know your risk. Watch the smart money. Stay ahead of the panic.

## Architecture

Xentinel is powered primarily by Xerberus Enterprise MCP for live risk intelligence. The core product flow is:

```txt
Wallet address
-> Xerberus wallet/entity rating
-> intrinsic/systemic/stress/contagion tools
-> dashboard modules
-> AI Co-Pilot explanation
```

External wallet-ingestion providers are not required for core risk intelligence. If Xerberus does not return position-level data for a wallet, Xentinel shows honest wallet-level analysis and leaves position tables empty rather than fabricating holdings.

## Core Modules

- Portfolio Guardian
- Stress Testing Engine
- Smart Money Sentinel
- Panic / Outflow Detector
- AI Chat Co-Pilot
- Beautiful Outputs

## Environment

Required:

MONGODB_URI=
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
AI_PROVIDER=groq
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
SMART_WALLET_WATCHLIST=
XERBERUS_ENTERPRISE_API_KEY=
XERBERUS_ENTERPRISE_MCP_URL=
XERBERUS_FRAMEWORK_API_KEY=
XERBERUS_FRAMEWORK_MCP_URL=

## Local Development

```bash
npm install
npm run dev
```

Verification:

```bash
npm run typecheck
npm run build
```

## Disclaimer

Demo application. Not financial advice.
