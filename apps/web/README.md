# @scrum-poker/web

The Next.js 16 (App Router) shell for Scrum Poker. This is the target app of the
CRA → Next.js migration (see `docs/superpowers/specs/2026-07-21-nextjs-migration-design.md`).
Scope of this package (issue #6) is a **thin, correct shell** — real UI, services,
SSE, and route logic land in later issues.

## Stack

- **Next.js 16** App Router, React 19, Turbopack (the default bundler).
- **Server Components by default**; `"use client"` is opt-in (only `global-error.tsx`
  and Sentry's `instrumentation-client.ts` are client-side here).
- **Tailwind CSS v4** wired to the shared preset in `@scrum-poker/config`.
- **Sentry** via `@sentry/nextjs` for client + server + edge.
- `output: "standalone"` for the Docker deploy (issue #17).

## Scripts (pnpm)

```bash
pnpm --filter @scrum-poker/web dev        # next dev (Turbopack)
pnpm --filter @scrum-poker/web build      # next build (production)
pnpm --filter @scrum-poker/web start      # next start (serves the build)
pnpm --filter @scrum-poker/web lint       # eslint .
pnpm --filter @scrum-poker/web typecheck  # tsc --noEmit
```

The root `pnpm -r <build|lint|typecheck|test>` scripts include this package
automatically because it is a workspace member.

## Routes

Route groups keep the folder structure organized without affecting URLs:

| URL    | Source                              | Purpose (later issue)          |
| ------ | ----------------------------------- | ------------------------------ |
| `/`    | `app/(start)/page.tsx`              | Start: create/join by PIN (#14)|
| `/dev` | `app/(developer)/dev/page.tsx`      | Developer voting (#15)         |
| `/po`  | `app/(product-owner)/po/page.tsx`   | Product Owner management (#16) |

API placeholders under `app/api/`:

| URL                 | Source                          | Purpose                         |
| ------------------- | ------------------------------- | ------------------------------- |
| `/api/health`       | `app/api/health/route.ts`       | Liveness (Docker healthcheck)   |
| `/api/sentry-check` | `app/api/sentry-check/route.ts` | Test the server error path      |

## Tailwind ↔ shared preset

Tailwind v4 uses CSS-first config. We keep tokens centralized in
`@scrum-poker/config` and consume them via a legacy JS config bridge:

- `app/globals.css` — `@import "tailwindcss";` then `@config "../tailwind.config.mjs";`
- `tailwind.config.mjs` — `presets: [preset]` where `preset` is imported from
  `@scrum-poker/config/tailwind`. **Tokens are never redefined here.**
- `postcss.config.mjs` — the single `@tailwindcss/postcss` plugin.

The landing page uses the `brand` color from the shared preset (e.g. `bg-brand`)
to prove tokens flow through.

## Environment conventions

See `.env.example`. Copy it to `.env.local` and fill values as needed.

- **Server-only** vars have **no** prefix (e.g. `DATABASE_URL`, `SENTRY_DSN`,
  `SENTRY_AUTH_TOKEN`). They are never inlined into the browser bundle.
- **Public** vars are prefixed **`NEXT_PUBLIC_`** (e.g. `NEXT_PUBLIC_SENTRY_DSN`)
  and are inlined into the client bundle at build time — non-secret values only.

With no Sentry DSN configured, the SDK is disabled and no events are sent.

## Sentry

- `instrumentation.ts` — `register()` loads the server/edge config per runtime and
  exports `onRequestError` to capture Server Component / route handler errors.
- `instrumentation-client.ts` — browser `Sentry.init` + `onRouterTransitionStart`.
- `sentry.server.config.ts` / `sentry.edge.config.ts` — per-runtime `Sentry.init`.
- `next.config.ts` is wrapped with `withSentryConfig` (source-map upload is skipped
  without `SENTRY_AUTH_TOKEN`; telemetry disabled).

To exercise the server error path (with a real DSN set in `.env.local`):

```bash
curl http://localhost:3000/api/sentry-check   # throws -> reported via onRequestError
```
