# ADR-0001: Initial stack and deploy pipeline

- Status: Accepted
- Date: 2026-05-09
- Decider: CTO (founding engineer)
- Issue: MSI-4

## Context

We are at zero. The company needs a deployable, observable web app skeleton
that gets us a live URL the CEO can hit, a working CI gate on PRs, and a
foundation we can build the dashboard, auth, and product features on without
re-platforming for the first design partner.

The CEO's brief on this issue is: *"Keep it boring. Don't pre-optimize. We can
re-platform later if needed."* That framing drives every decision below.

## Decision

| Area | Choice | One-liner |
| --- | --- | --- |
| Language | TypeScript (strict) | Type safety pays for itself once a second person touches the code. |
| Framework | Next.js 15 (App Router, React 19) | Industry-default React framework; lets us add SSR/API routes later without rewriting. |
| Package manager | pnpm | Fast, disk-efficient, strict node_modules. |
| Testing | Vitest + jsdom | Vite-native, fast, no Babel/Jest config gymnastics. |
| Lint | ESLint via `eslint-config-next` | Zero-config alignment with the framework's recommended rules. |
| Source control | GitHub | Where the founder already has an account; integrates with everything. |
| CI | GitHub Actions | Same vendor as the repo; no extra account. |
| Deploy (today) | GitHub Pages via Next.js static export (`output: "export"`) | Free, no extra credentials, deploys on every push to `main`, gives us a real `https://` URL today. |
| Deploy (later) | Migrate to Vercel when we need SSR, ISR, API routes, or middleware. | Trigger: first feature that needs server-rendering or a server-side secret. |
| Error tracking | Sentry (deferred) | Industry default. Wired with `NEXT_PUBLIC_SENTRY_DSN`; if the env var is unset the SDK is a no-op, so cost = $0 until we opt in. |
| Log aggregation | Vercel/Axiom once we move off Pages | GitHub Pages serves static assets; there are no server logs to aggregate yet. CI logs live in GitHub Actions. |

## Why these specifically

**Next.js over a bespoke Vite + React SPA.** Both are "boring", but Next gives
us file-based routing, image optimisation, metadata, and a clear migration
path from static export → Vercel SSR without changing the app code. The cost
of that optionality is near zero today.

**GitHub Pages over Vercel as the first deploy target.** Vercel is the
"correct" answer for Next.js long-term, but it requires a Vercel account and
either a manual GitHub-app install or three CI secrets (`VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). GitHub Pages requires nothing beyond
the GitHub auth we already have, and the static-export path is one config
flag in `next.config.ts`. We get a live URL the CEO can hit *today* instead
of "after the CEO logs in to Vercel". The migration to Vercel is a same-day
job whenever we actually need SSR.

**Vitest over Jest.** Jest with Next.js 15 + React 19 + ESM is currently a
config minefield. Vitest is one config file, runs in-process, and supports
the same `describe/it/expect` API everyone already knows.

**No Tailwind / no Turbopack at scaffold time.** We have one page. Adding
Tailwind would be pre-optimisation, and Turbopack is still gaining stability
on the build path. Easy to add either later.

**Sentry deferred behind a feature-flag env var.** "Wire up error tracking"
in the issue is real, but signing up for a Sentry org and rotating a DSN is a
CEO-level account decision, not a code change. The SDK will be added in a
follow-up issue once we have a Sentry project; the env-var-gated initialisation
shape means turning it on is a single CI secret, not a refactor.

## Consequences

- We can ship a live URL and a passing PR pipeline in this heartbeat. ✅
- We accept that the first deploy is static-only. No SSR, no API routes, no
  server-side secrets. The moment a feature needs any of those, we cut over
  to Vercel — tracked as a follow-up when triggered.
- Logs from "the app" today are browser-side only. Acceptable while there is
  no server. Revisit when we have one.
- ESLint 9 + `eslint-config-next` uses the new flat-config format; if we
  add tooling that expects `.eslintrc`, we'll need a compat layer.

## Open follow-ups

- MSI-?: Provision Sentry project, add `NEXT_PUBLIC_SENTRY_DSN` to repo
  secrets, drop in `@sentry/nextjs`. (CEO needs to create the org.)
- MSI-?: Migrate deploy to Vercel when the first SSR/API-route feature lands.
- MSI-?: Add Prettier + a pre-commit hook once a second contributor joins —
  not worth the friction for a solo codebase.
