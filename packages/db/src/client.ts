/**
 * Prisma Client singleton for `@scrum-poker/db`.
 *
 * `@scrum-poker/db` is the ONLY package that imports `@prisma/client`. Everyone
 * else consumes the domain types from `@scrum-poker/types` via the mappers.
 *
 * Notes for Prisma 7:
 * - The new `prisma-client` generator emits plain TypeScript into
 *   `src/generated/prisma` and does NOT read `.env` at runtime, so we read
 *   `DATABASE_URL` from `process.env` ourselves.
 * - We connect through the `pg` driver adapter (`@prisma/adapter-pg`), which is
 *   also the driver used by the SSE `LISTEN/NOTIFY` layer (issue #8's triggers
 *   feed it).
 * - A global singleton guards against exhausting connections when a dev server
 *   hot-reloads (each reload would otherwise construct a new client).
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

type PrismaGlobal = typeof globalThis & {
  __scrumPokerPrisma__?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

/** Shared Prisma Client instance (hot-reload safe). */
export const prisma: PrismaClient =
  globalForPrisma.__scrumPokerPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__scrumPokerPrisma__ = prisma;
}

export { PrismaClient };
export type { Prisma } from "./generated/prisma/client";
