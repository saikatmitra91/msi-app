# ADR-0002: Auth and data stack

- Status: Accepted
- Date: 2026-05-09
- Decider: CTO (founding engineer)
- Issue: MSI-5
- Supersedes: nothing
- Related: ADR-0001 (initial stack)

## Context

MSI-5 needs:

- email + magic-link or OAuth login
- a `users` and `workspaces` data model with basic CRUD
- a logged-in dashboard shell
- session handling, logout, profile

Today the app is a static export deployed to GitHub Pages (ADR-0001). Real
auth needs at least one of: server-side code (API routes / SSR), or a
backend-as-a-service the client can talk to directly.

The CEO's standing brief is *"Keep it boring. Don't pre-optimize."*

## Decision

We pick **Supabase** for production auth + database, behind a thin
provider-agnostic abstraction in `src/lib/auth`.

| Concern | Choice | Why |
| --- | --- | --- |
| Auth | Supabase Auth (email magic-link) | Boring default for client-side apps; magic-link removes the password-reset surface. |
| Database | Supabase Postgres (with RLS) | Comes free with the Supabase project, no second account to provision. |
| Client SDK | `@supabase/supabase-js` | Works against the static export; no need to migrate off GitHub Pages today. |
| Session storage | Supabase SDK default (localStorage) | Persists across reloads, no server cookie required. |
| Dev/test provider | In-memory provider in this repo | Lets us build, demo, and ship the UI + flows before the Supabase project is provisioned, and gives us a fast hermetic test suite. |

The abstraction lives at `src/lib/auth/provider.ts`. There are two
implementations:

- `MemoryAuthProvider` — used in dev when `NEXT_PUBLIC_SUPABASE_URL` is unset,
  and in all tests. Stores users in `localStorage` and "sends" magic links by
  logging the link to the console / surfacing it in the dev UI.
- `SupabaseAuthProvider` — used in production once
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are wired in.
  (Lands in a follow-up issue once the CEO has provisioned the Supabase
  project.)

A `users` row is the user's identity (id, email, displayName, createdAt). A
`workspaces` row is `(id, name, ownerUserId, createdAt)`. Membership is a
join table `workspace_members(workspaceId, userId, role)`. The same shape
maps cleanly to Supabase tables with RLS policies in the follow-up.

## Why these specifically

**Supabase over Auth.js + self-hosted Postgres.** Auth.js is the boring
*Next.js with SSR* answer, but it requires API routes — which means giving
up the static export and migrating to Vercel today. That migration was
already on the followup list (ADR-0001), but it adds a second account
(Vercel) and a third (Postgres host) to today's critical path. Supabase is
one account that gives us auth + DB + magic-link email out of the box, and
the static export keeps deploying. We can re-platform to Auth.js + Postgres
later if Supabase ever bites us; the abstraction makes the switch a
provider swap, not a rewrite.

**Magic-link over OAuth-only.** OAuth adds a third-party account dependency
(Google / GitHub OAuth client setup) and a redirect-URL configuration that
breaks every time we change deploy targets. Magic-link is one input field,
one email, no provider config. We can add OAuth later as another provider
in the same abstraction.

**Provider abstraction over "just call Supabase everywhere".** The cost is
~50 lines of TypeScript. The benefit is (a) every test runs against the
in-memory provider with no network, and (b) the day we want to migrate
off Supabase we change one file, not every component.

**In-memory provider that mounts in dev.** This is not "mock auth that
doesn't work". The flows (signup, magic-link click, login, logout, session
persistence, protected routes) run end-to-end against it. We meet MSI-5's
acceptance criteria without waiting on the Supabase account.

**Workspaces, not teams.** Both are fine. "Workspace" is the term we'll
use in product copy to keep the terminology consistent.

## Consequences

- We can ship MSI-5's acceptance criteria today against the in-memory
  provider, with tests, without external account setup.
- A follow-up issue (linked) will wire in the Supabase provider once the
  CEO has provisioned a project and dropped `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` into repo secrets.
- The static export keeps deploying to GitHub Pages. No Vercel migration
  required for this issue.
- Production auth lives entirely client-side (anon key + RLS). Anything
  privileged (admin actions, server-only secrets) will require a server
  surface, at which point we revisit the deploy story.
- Any future "server actions only" feature (e.g. webhooks, server cron) is
  still a Vercel migration trigger. ADR-0001's followup stays open.

## Open follow-ups

- MSI-?: Provision Supabase project, add `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repo + Pages secrets, swap the active
  provider from `memory` to `supabase`, port the in-memory schema to a
  Supabase migration. (CEO must create the Supabase org.)
- MSI-?: Add OAuth provider (Google) once we have a domain to configure
  the redirect URL against.
- MSI-?: Add a server-side surface (Vercel migration) the first time a
  feature needs server-only secrets or webhooks.
