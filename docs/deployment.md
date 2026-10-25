# Deployment

The Worker name is `market-vault-web` and its custom domain is
`market-vault.onichandame.com`. `wrangler.jsonc` owns the custom-domain route, production Vault
URL, compatibility date, and observability settings.

GitHub Actions deploys `main` after typecheck, production build, and Wrangler dry-run validation.
The deploy job uses the `cloudflare/wrangler-action@v3` action with these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The frontend has no application secrets. Local Vault access is controlled by the Vault process's
`MARKET_VAULT_CORS_ORIGINS` environment variable.
