# Market Vault Web

The public, read-only Market Vault chart at `market-vault.onichandame.com`.

The page opens one Vault WebSocket stream for the selected public market and interval, requests the latest 300 closed candles, then upserts live candle updates by `open_time_ms`. It does not poll REST. The Vault must allow CORS from `https://market-vault.onichandame.com` for HTTP clients; WebSocket connections use the same public origin directly.

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run deploy
```

Set `VITE_VAULT_BASE_URL` for local builds when using a different Vault endpoint. Production is configured in `wrangler.jsonc`.

See [docs/architecture.md](docs/architecture.md), [docs/development.md](docs/development.md),
and [docs/deployment.md](docs/deployment.md) for details. When searching for repository
guidance, use `den search` first.
