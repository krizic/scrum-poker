/**
 * Session data-access service (server-only).
 *
 * Prisma-backed replacement for the session methods of the legacy PouchDB
 * `ApiService` (`src/api/index.ts`): `post` (create), `getSession`, `update`,
 * and `delete`. The legacy CouchDB document nested all estimations and votes
 * inside one session document; here they are normalized into related tables,
 * so `getSession` eager-loads the `estimations` (and their `votes`) to
 * reproduce the "whole session graph in one read" behavior callers relied on.
 *
 * All writes go through the shared Prisma client, so the `pg_notify` triggers
 * in `@scrum-poker/db` fire automatically and feed the SSE layer (issue #12).
 */
import "server-only";

import { prisma, toSession } from "@scrum-poker/db";
import type { Session } from "@scrum-poker/types";

/** Fields a caller may set when creating a session. */
export interface CreateSessionInput {
  name?: string;
  pin?: string;
}

/** Mutable session fields (both optional and nullable, like the schema). */
export interface UpdateSessionInput {
  name?: string | null;
  pin?: string | null;
}

/** Include the full session → estimations → votes graph, deterministically ordered. */
const withGraph = {
  estimations: {
    orderBy: { createdAt: "asc" },
    include: {
      votes: {
        orderBy: { createdAt: "asc" },
      },
    },
  },
} as const;

/**
 * Create a new session. Mirrors legacy `ApiService.post` — both `name` and
 * `pin` are optional (a session can be created before it is named/pinned).
 */
export async function createSession(
  input: CreateSessionInput = {},
): Promise<Session> {
  const row = await prisma.session.create({
    data: { name: input.name, pin: input.pin },
  });
  return toSession(row);
}

/**
 * Load a session with its full estimations + votes graph. Replaces legacy
 * `ApiService.getSession`. Returns `null` when no session matches (legacy threw;
 * the caller/route layer decides how to surface "not found").
 */
export async function getSession(id: string): Promise<Session | null> {
  const row = await prisma.session.findUnique({
    where: { id },
    include: withGraph,
  });
  return row ? toSession(row) : null;
}

/**
 * Look up a session by its join PIN. The legacy app joined sessions by PIN from
 * the Start page; `pin` is not unique in the schema, so the most recently
 * created match wins. Returns the full graph like {@link getSession}.
 */
export async function getSessionByPin(pin: string): Promise<Session | null> {
  const row = await prisma.session.findFirst({
    where: { pin },
    orderBy: { createdAt: "desc" },
    include: withGraph,
  });
  return row ? toSession(row) : null;
}

/**
 * Update a session's `name`/`pin`. Replaces legacy `ApiService.update` (which
 * also bumped `last_updated`; here `lastUpdated` is maintained by Prisma's
 * `@updatedAt`). Only provided fields are changed.
 */
export async function updateSession(
  id: string,
  input: UpdateSessionInput,
): Promise<Session> {
  const row = await prisma.session.update({
    where: { id },
    data: { name: input.name, pin: input.pin },
    include: withGraph,
  });
  return toSession(row);
}

/**
 * Delete a session. Cascades to its estimations and votes (schema
 * `onDelete: Cascade`). Replaces legacy `ApiService.delete`.
 */
export async function deleteSession(id: string): Promise<void> {
  await prisma.session.delete({ where: { id } });
}
