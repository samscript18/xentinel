# Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production URL.
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` if API calls need an explicit base URL.
- [ ] Set `MONGODB_URI`.
- [ ] Set Xerberus Enterprise credentials.
- [ ] Set at least one AI provider key.
- [ ] Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- [ ] Optionally set `SMART_WALLET_WATCHLIST`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Verify `/`.
- [ ] Verify `/dashboard`.
- [ ] Verify all dashboard modules.
- [ ] Verify core API routes.
- [ ] Confirm no secret env vars use `NEXT_PUBLIC_`.
- [ ] Confirm "Not financial advice" appears in output/report surfaces.
