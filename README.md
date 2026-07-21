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
