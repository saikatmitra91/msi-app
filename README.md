# msi-app

Hello-world skeleton for the company's web app.

## Stack

See [`docs/adr/0001-stack.md`](docs/adr/0001-stack.md). Short version: Next.js
15 + TypeScript, ESLint, Vitest, GitHub Actions CI, deployed as a static
export to GitHub Pages.

## Local dev

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test
pnpm build        # static export to ./out
```

Node 22 (see `.nvmrc`), pnpm 10.

## CI / Deploy

- `.github/workflows/ci.yml` — lint + typecheck + test + build, runs on every
  PR and on `main`.
- `.github/workflows/deploy.yml` — builds the static export and publishes to
  GitHub Pages on every push to `main`.

The live URL is whatever GitHub Pages assigns the repo (configured under
**Settings → Pages → Source: GitHub Actions**).

## Observability

`src/lib/observability.ts` is a Sentry-shaped shim that no-ops until
`NEXT_PUBLIC_SENTRY_DSN` is set. Use `track.event(...)` and `track.error(...)`
from app code; the swap to real Sentry is a single-file change.

## CI status

The `CI` workflow runs lint, typecheck, tests, and a production build on
every PR. Green here = safe to merge.
