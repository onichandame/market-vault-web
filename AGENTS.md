# Market Vault Web

## Scope

This repository contains the read-only React Router Worker for the public Market Vault chart.
The browser receives candles from Vault's WebSocket stream. It may use the Vault REST candle
endpoint only for older history when the chart is scrolled left; it must not poll for live data.

## Working rules

- Search existing documentation with `den search` before guessing an interface or deployment rule.
- Keep the public Vault market contract source-independent: use `market` and `interval`; do not
  reintroduce `source`, `symbol`, or provider-specific parameters in browser code.
- Keep the production Vault URL in `wrangler.jsonc`; use `VITE_VAULT_BASE_URL` for local overrides.
- Keep visual changes within the existing dark graphite data-console language and preserve keyboard
  focus, responsive layout, and readable numeric formatting.
- Run `npm run typecheck` and `npm run build` before committing.

## Documentation hierarchy

- `README.md`: project purpose and the shortest local/deploy quickstart.
- `docs/architecture.md`: runtime data flow and browser/Vault boundaries.
- `docs/development.md`: local development and validation workflow.
- `docs/deployment.md`: Wrangler, custom domain, secrets, and production deployment.

Put durable operational details in the relevant document instead of expanding this file.
