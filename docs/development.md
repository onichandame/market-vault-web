# Development

Use the repository's local dependencies:

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

The default local page is `http://localhost:5173`. Set `VITE_VAULT_BASE_URL` when testing
against another Vault. The deployed build defaults to the public Vault URL from `wrangler.jsonc`.

Before a commit, run:

```sh
npm run typecheck
npm run build
```

Use `den search "<topic>"` before inspecting unrelated files when looking for repository
contracts or operational guidance.
