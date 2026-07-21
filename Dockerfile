# syntax=docker/dockerfile:1.7
###############################################################################
# Multi-stage Dockerfile for @scrum-poker/web (Next.js 16 standalone) in a pnpm
# workspace monorepo. See issue #17 / docs/superpowers/specs/2026-07-21-*.
#
# Stages:
#   base     — node:22-alpine + pnpm (corepack) + libs Prisma's engine needs.
#              (pnpm 11.15.1 requires Node >=22.13; Next 16 + Prisma 7 support 22.)
#   deps     — frozen, cached install of ALL workspace deps (manifests first).
#   build    — `prisma generate` then the Next.js standalone build of apps/web.
#   migrator — lean, isolated Prisma CLI toolkit for `migrate deploy` at startup.
#   runner   — minimal prod image: standalone server + static + migration toolkit.
#
# Why standalone: a long-lived Node runtime is required for SSE + Postgres
# LISTEN/NOTIFY. `output: "standalone"` (apps/web/next.config.ts) + the pinned
# workspace root (turbopack.root) trace the monorepo so server.js lands at
# apps/web/server.js with a self-contained node_modules. The generated Prisma
# client is pure TS transpiled INTO the Next bundle (driver-adapter, no native
# query engine), so the app runtime needs no separate Prisma engine — only the
# migrator toolkit does, for `migrate deploy`.
###############################################################################

########################## base ##############################################
FROM node:22-alpine AS base
# libc6-compat + openssl: required by Prisma's Rust schema-engine (migrate) on
# musl/alpine. Harmless for the app runtime.
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

########################## deps ##############################################
# Install once, cached on the manifests + lockfile so source edits don't bust it.
FROM base AS deps

# Workspace manifests + lockfile first (best layer caching).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/components/package.json ./packages/components/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# @scrum-poker/db's `postinstall` runs `prisma generate`, which needs the schema
# + prisma.config.ts. Copy them before install so the client is generated here.
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/prisma.config.ts ./packages/db/prisma.config.ts

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

########################## build #############################################
FROM base AS build

# Bring the fully-installed workspace (root + per-package node_modules + the
# pnpm virtual store links) from deps, then overlay the source (.dockerignore
# keeps node_modules/.next out of the context so nothing is clobbered).
COPY --from=deps /app ./
COPY . .

# Ensure the Prisma client exists for @scrum-poker/db before building web (the
# source overlay does not include the gitignored generated client).
RUN pnpm --filter @scrum-poker/db run db:generate

# apps/web has no public/ dir yet; create it so the runner COPY always succeeds.
RUN mkdir -p apps/web/public

# Next.js standalone production build (Turbopack).
RUN pnpm --filter @scrum-poker/web build

########################## migrator ##########################################
# A tiny, isolated toolkit that can run `prisma migrate deploy` at startup
# without dragging the whole dev toolchain into the runtime image.
FROM base AS migrator
WORKDIR /app/migrate
COPY docker/migrate-package.json ./package.json
COPY docker/migrate-pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install
# Schema + migrations + Prisma 7 config (supplies datasource url from env).
COPY packages/db/prisma ./prisma
COPY packages/db/prisma.config.ts ./prisma.config.ts

########################## runner ############################################
FROM node:22-alpine AS runner
# openssl/libc6-compat for the Prisma schema-engine used by `migrate deploy`.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV RUN_MIGRATIONS=true

# Run as a non-root user.
RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S nextjs -G nodejs

# Next.js standalone runtime (self-contained: server.js at apps/web/ + traced
# node_modules at repo-root-relative paths).
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Static assets + public are not traced into standalone; copy them explicitly.
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Migration toolkit (Prisma CLI + schema + migrations).
COPY --from=migrator --chown=nextjs:nodejs /app/migrate ./migrate

# Entrypoint: apply migrations (toggleable) then start the server.
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
