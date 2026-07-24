/**
 * `@scrum-poker/db` — Prisma 7 + Postgres data layer.
 *
 * The only package that imports `@prisma/client`. Public surface:
 * - `prisma`: the shared, hot-reload-safe Prisma Client singleton.
 * - `PrismaClient` / `Prisma`: re-exported generated client + namespace for the
 *   (future) services layer (issue #11).
 * - row → `@scrum-poker/types` mappers (`toSession` / `toEstimation` / `toVote`)
 *   and their row input types.
 */
export { prisma, PrismaClient } from "./client";
export type { Prisma } from "./client";

export {
  toEstimation,
  toSession,
  toVote,
} from "./mappers";
export type { EstimationRow, SessionRow, VoteRow } from "./mappers";
