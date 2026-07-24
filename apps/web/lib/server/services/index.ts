/**
 * Server-side data-access / service layer for scrum-poker.
 *
 * Prisma-backed replacement for the legacy PouchDB `ApiService`
 * (`src/api/index.ts`), split into cohesive per-aggregate modules:
 * - {@link ./session} — create/get(/by-pin)/update/delete session.
 * - {@link ./estimation} — create/update/activate/delete/import estimation
 *   (including the single-active-estimation transaction).
 * - {@link ./vote} — cast/change a vote (upsert on `(estimationId, voterId)`).
 * - {@link ./user-info} — pure client-identity → vote-field mapping.
 *
 * These are consumed by Server Actions / route handlers in later issues (#12,
 * #14–16). Every write goes through the shared Prisma client so the
 * `pg_notify` DB triggers fire for the SSE realtime layer.
 *
 * `server-only` guarantees this module (and everything it re-exports that is
 * itself `server-only`) can never be pulled into a client bundle.
 */
import "server-only";

export * from "./session";
export * from "./estimation";
export * from "./vote";
export * from "./user-info";
