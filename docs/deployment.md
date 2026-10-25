# Deployment

The Worker name is `market-vault-web` and its custom domain is
`market-vault.onichandame.com`. `wrangler.jsonc` owns the Worker entry, client assets directory,
custom-domain route, production Vault URL, compatibility date, and observability settings.

`npm run build` must run before `wrangler deploy`. It creates `build/server/index.js` for the
Worker entry and `build/client` for static assets. Deploying the root config without the build
step, or pointing assets at `public`, produces a Worker without the React Router document and
returns 404 at `/`.

GitHub Actions deploys `main` after typecheck, production build, and Wrangler dry-run validation.
The deploy job uses the `cloudflare/wrangler-action@v3` action with these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The frontend has no application secrets. Local Vault access is controlled by the Vault process's
`MARKET_VAULT_CORS_ORIGINS` environment variable.
