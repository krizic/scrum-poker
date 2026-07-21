# scrum-poker

Real-time planning poker for agile estimation. A product owner creates a session
and shares its PIN; developers join by PIN and vote on estimations, and the
product owner reveals votes, views statistics, and imports estimations from CSV.

Built as a **pnpm workspace monorepo** on **Next.js 16** (App Router, React 19,
Server Components by default) with **Tailwind CSS v4**, **Prisma 7 + PostgreSQL**,
and **realtime updates via Server-Sent Events backed by Postgres `LISTEN/NOTIFY`**.
Errors are reported through the **Sentry** Next.js SDK. Deployment is a
self-hosted **Docker** image (Next standalone Node server) plus Postgres.

## Architecture

The repo is a pnpm workspace. Internal packages use the `workspace:*` protocol
and the `@scrum-poker/*` scope. The dependency graph is a DAG
(`apps/web → components → ui`, `apps/web → db`, everything → `types`/`utils`/`config`).

```
scrum-poker/
├─ apps/
│  └─ web/                 # @scrum-poker/web — Next.js 16 App Router app + api routes
├─ packages/
│  ├─ config/             # @scrum-poker/config — shared tsconfig, ESLint, Tailwind & Vitest presets
│  ├─ types/              # @scrum-poker/types — framework-agnostic domain types (Session/Estimation/Vote)
│  ├─ db/                 # @scrum-poker/db — Prisma 7 schema, migrations, seed, client, pg_notify triggers
│  ├─ utils/              # @scrum-poker/utils — pure helpers (vote stats, chart shaping, CSV)
│  ├─ ui/                 # @scrum-poker/ui — Tailwind + Radix primitives (Button, Card, Table, Reveal…)
│  └─ components/         # @scrum-poker/components — composed app components (poker card, votes, charts…)
├─ pnpm-workspace.yaml
├─ turbo.json             # task runner (build/typecheck/lint/test DAG)
├─ docker-compose.yml     # web + postgres
└─ Dockerfile             # Next.js standalone image (builds only apps/web)
```

`packages/db` is the **only** package that imports `@prisma/client`, and it is
consumed server-side only.

### Roles & routes

| Route  | Role          | Purpose                                                                           |
| ------ | ------------- | --------------------------------------------------------------------------------- |
| `/`    | Start         | Product Owner creates a session; Developers join by PIN. Captures and stores local identity (localStorage). |
| `/dev` | Developer     | Vote on the active estimation; live updates via SSE.                              |
| `/po`  | Product Owner | Create/manage estimations, activate & reveal, view stats (nivo), import CSV.      |

## Local development

Requires **Node 22.13+** and **pnpm 11.15.1** (pinned via the root
`packageManager` field) plus **Docker** (for the local Postgres). The fastest
path is the one-command setup:

```bash
pnpm install     # install the workspace + generate the Prisma client
pnpm db:setup    # create local env files, start Postgres, migrate + seed
pnpm dev         # run the app at http://localhost:3000
```

`pnpm db:setup` is idempotent and wires everything a fresh clone needs. To do it
in a single step, `pnpm setup` runs `pnpm install && pnpm db:setup`; `pnpm dev:up`
starts the database (if not already running) and then the dev server.

### Database & dev scripts

All of these are exposed at the repo root:

| Script | What it does |
| --- | --- |
| `pnpm db:setup` | env bootstrap → `db:up` → `db:migrate` → `db:seed` (one-shot local setup) |
| `pnpm db:up` | start the local Postgres (`docker compose up -d --wait db`) |
| `pnpm db:down` | stop the local Postgres (keeps the data volume) |
| `pnpm db:reset` | stop Postgres **and drop its data volume** (`docker compose down -v`) |
| `pnpm db:migrate` | apply/create migrations (`prisma migrate dev`) + regenerate client |
| `pnpm db:deploy` | apply committed migrations without prompts (`prisma migrate deploy`) |
| `pnpm db:seed` | load sample data (a demo session + estimation + votes) |
| `pnpm db:generate` | regenerate the Prisma client |
| `pnpm db:studio` | open Prisma Studio |
| `pnpm env:setup` | create local env files from the `.env.example` templates (idempotent) |
| `pnpm dev` | run the Next.js dev server (`apps/web`) |
| `pnpm dev:up` | `db:up` then `dev` |

`pnpm env:setup` copies `apps/web/.env.example` → `apps/web/.env.local` and
`packages/db/.env.example` → `packages/db/.env` (both gitignored) so
`DATABASE_URL` is available to the Next.js dev server and the Prisma CLI. Existing
files are never overwritten — edit them if your Postgres differs from the default
(`postgres:postgres@localhost:5432/scrumpoker`, which matches `docker compose`).

Prefer your own Postgres instead of Docker? Skip `db:up`, point `DATABASE_URL` at
it (in `packages/db/.env` and `apps/web/.env.local`), then run `pnpm db:migrate`
and `pnpm db:seed`.

Workspace-wide scripts (delegate across every package, matching CI):

```bash
pnpm typecheck   # pnpm -r typecheck
pnpm lint        # pnpm -r lint
pnpm build       # pnpm -r build
pnpm test        # pnpm -r test
```

`turbo run <task>` is also available for cached, dependency-ordered runs.

### Environment variables

Copy `.env.example` to `.env` and adjust. The key variable is `DATABASE_URL`,
used by Prisma (queries + `migrate deploy`) **and** the direct pg
`LISTEN/NOTIFY` realtime hub. Sentry DSNs are optional (leave blank to disable);
browser-exposed values must use the `NEXT_PUBLIC_*` prefix. **Never commit real
secrets.**

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
toolkit). It builds **only** the `apps/web` workspace app.

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

## License

MIT — see [LICENCE](./LICENCE).
