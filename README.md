# scrum-poker

> Migration in progress to Next.js 16 + pnpm workspaces. The full README is
> reworked in issue #19; this section documents the Docker deploy (issue #17).

## Run with Docker

Self-hosted stack: the Next.js 16 **standalone** Node server (long-lived — required
for the SSE + Postgres `LISTEN/NOTIFY` realtime transport) plus Postgres, wired up
with `docker compose`. On startup the `web` container applies Prisma migrations,
then serves on port **3000**.

```bash
# 1. (optional) configure env — safe local defaults work out of the box
cp .env.example .env

# 2. build the image and start Postgres + the app
docker compose up --build

# 3. verify (in another shell)
curl http://localhost:3000/api/health      # -> {"status":"ok"}
open http://localhost:3000                  # Start page

# 4. stop and drop the database volume
docker compose down -v
```

### Environment variables

| Variable                 | Service | Default            | Purpose                                                              |
| ------------------------ | ------- | ------------------ | ------------------------------------------------------------------- |
| `POSTGRES_USER`          | db      | `postgres`         | Postgres role.                                                      |
| `POSTGRES_PASSWORD`      | db      | `postgres`         | Postgres password. **Change for anything but local.**              |
| `POSTGRES_DB`            | db      | `scrumpoker`       | Database name.                                                     |
| `DATABASE_URL`           | web     | derived from above | Used by Prisma (queries + `migrate deploy`) **and** the pg `LISTEN/NOTIFY` hub. |
| `RUN_MIGRATIONS`         | web     | `true`             | Apply Prisma migrations on container start; set `false` to skip.   |
| `SENTRY_DSN`             | web     | _(empty)_          | Server-side Sentry DSN (optional).                                 |
| `NEXT_PUBLIC_SENTRY_DSN` | web     | _(empty)_          | Browser Sentry DSN (optional, public).                            |

See `.env.example` for the full list. **Never commit real secrets.**

### Healthcheck

The `web` service is healthy once `GET /api/health` returns `{"status":"ok"}`
(compose `depends_on` gates `web` on Postgres being healthy first).

### Build a standalone image (without compose)

```bash
docker build -t scrum-poker-web .
# provide DATABASE_URL at runtime; migrations run via the entrypoint
docker run --rm -p 3000:3000 -e DATABASE_URL=postgresql://... scrum-poker-web
```

The image is multi-stage (`deps` → `build` → `runner`, plus an isolated `migrator`
toolkit). It builds **only** the `apps/web` workspace app; the legacy CRA root app
is excluded via `.dockerignore` and is not part of the image.

---

## Testing & CI

The workspace uses **Vitest** + **Testing Library** (`@testing-library/react` +
`@testing-library/jest-dom`, via jsdom). The shared jsdom + matchers setup lives
in `@scrum-poker/config` (`config/vitest` factory + `config/vitest-setup`), so
component/route packages don't duplicate boilerplate.

```bash
# run every package's tests
pnpm -r test

# run one package's tests
pnpm --filter @scrum-poker/ui test
pnpm --filter @scrum-poker/components test
```

There are two kinds of tests:

- **Pure/component tests** (utils, ui, components, realtime hub unit) run
  anywhere with no external services.
- **DB-backed tests** (service/invariant tests and the live `pg_notify` realtime
  path, files ending in `*.db.test.ts`) require a real Postgres reachable via
  `DATABASE_URL` with the schema migrated. They **skip automatically when
  `DATABASE_URL` is unset**, so `pnpm -r test` stays green on a bare checkout.

To run the DB-backed suites locally, point `DATABASE_URL` at a Postgres with the
migrations applied — e.g. an ephemeral container:

```bash
docker run -d --name sp-test-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scrumpoker -p 5432:5432 postgres:16-alpine
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scrumpoker
pnpm --filter @scrum-poker/db run db:deploy   # apply migrations (incl. pg_notify triggers)
pnpm -r test
docker rm -f sp-test-pg
```

### GitHub Actions

`.github/workflows/ci.yml` runs on every push and pull request. It uses pnpm
(pinned via the root `packageManager` field) + Node 22, installs with
`--frozen-lockfile`, then runs `pnpm -r typecheck`, `pnpm -r lint`,
`pnpm -r build`, and `pnpm -r test`. A `postgres:16-alpine` **service container**
(with a `pg_isready` health check) backs the job; CI applies the Prisma
migrations (`prisma migrate deploy`) before the test step, so the DB-backed
invariant tests — one-vote-per-user and single-active-estimation — actually run
and turn CI red if those guarantees regress.

---

## Skills

### DONE (22-04-2020)
- new Map()
- new Set()
- Array Global Object
- Iterating through Objects
- React Charts
- Array.reduce(\*, Map)
- React component creation
- Passing Props from parent component
- Conditional Rendering
- Importing styles in component
- Assigning class to component (className)
- Finding, Evaluating and Adding new NPM package (library)
