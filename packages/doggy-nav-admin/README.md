# Doggy Nav Admin

Umi/Ant Design admin console for Doggy Nav.

## Development

- Install: `pnpm install`
- Dev: `pnpm -F doggy-nav-admin dev`
- Lint: `pnpm -F doggy-nav-admin lint`
- Build: `pnpm -F doggy-nav-admin build` (outputs to `dist/`)

## Cloudflare Pages (Deployment)

This package ships with:

- SPA fallback: `public/_redirects` → routes `/*` to `/index.html`
- API proxy (Pages Functions): `functions/api/[[path]].ts` forwarding `/api/*` to `${DOGGY_SERVER}/api/*` and injecting `x-client-secret` (server-side only)

Recommended deploy path: GitHub Actions → “Deploy Admin to Cloudflare Pages (Manual)”.

### Prerequisites (GitHub Secrets)

- `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PAGES_PROJECT_NAME`
- Optional: `DOGGY_SERVER`, `DOGGY_SERVER_CLIENT_SECRET`

### Trigger manual deploy

GitHub → Actions → “Deploy Admin to Cloudflare Pages (Manual)” → choose environment (`production` or `preview`).

The workflow builds this package and deploys `dist/` with `functions/` using Wrangler from the workers package:

```bash
pnpm -F doggy-nav-workers exec wrangler pages deploy dist \
  --project-name <project> \
  --branch <branch> \
  --cwd packages/doggy-nav-admin
```

Secrets (if provided) are pushed to the Pages project:

```bash
wrangler pages secret put DOGGY_SERVER --project-name <project> --environment <production|preview> --cwd packages/doggy-nav-admin
wrangler pages secret put DOGGY_SERVER_CLIENT_SECRET --project-name <project> --environment <production|preview> --cwd packages/doggy-nav-admin
```

### Local check (optional)

```bash
pnpm -F doggy-nav-admin build
pnpm -F doggy-nav-workers exec wrangler pages dev dist --cwd packages/doggy-nav-admin
```

## Notes

- Do not expose `DOGGY_SERVER_CLIENT_SECRET` on the client; it is only injected by the proxy function.
- For more detail, see `docs/DEPLOYMENT.md` → “Cloudflare Pages (Admin)”.
