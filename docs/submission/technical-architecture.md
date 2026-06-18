# Technical Architecture Summary

Xentinel is a full-stack Next.js application using the App Router.

## Frontend

- Next.js 16
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- React Flow
- TanStack React Query
- RainbowKit / wagmi / viem

## Backend

- Next.js API routes
- Axios-based Xerberus MCP client
- Server-only Xerberus service layer
- Server-only AI provider layer
- MongoDB + Mongoose for smart-wallet snapshots

## Risk Flow

```txt
Wallet Address
-> API route
-> Xerberus service wrapper
-> Normalization layer
-> Product module response
-> React Query hook
-> Dashboard UI
-> AI Co-Pilot context builder
```

## AI Flow

```txt
User Question
-> Portfolio / stress / panic / smart-money / contagion context
-> AI provider fallback chain
-> Analyst-style response
```

Provider fallback order:

```txt
OpenRouter -> Groq -> Gemini
```

## Safety

- Secret keys stay server-side.
- No private keys are requested or stored.
- Wallet connect only supplies the public address.
- Slow or unavailable tools return module-level unavailable states.
- Xentinel does not fabricate wallet holdings.
