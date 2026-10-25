# Architecture

Market Vault Web is a single-page React Router application packaged as a Cloudflare Worker.
The page opens one WebSocket connection to Vault for the selected public `market` and `interval`.
Vault sends the latest 300 closed candles followed by `ready`; subsequent candle messages are
upserted by `open_time_ms`. A reconnect is owned by the browser connection lifecycle.

When the visible chart reaches its left edge, the page requests older rows through
`GET /v1/candles?market=...&interval=...&limit=300&before=...`. Vault selects the latest rows
strictly before `before` in descending order, then returns that batch in ascending order. The
page merges it into the same candle map and keeps the current viewport stable.

The browser talks directly to the public Vault origin. Vault allows the configured web origin
through `MARKET_VAULT_CORS_ORIGINS`; WebSocket streaming uses the same public origin directly.
