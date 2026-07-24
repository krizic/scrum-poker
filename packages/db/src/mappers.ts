/**
 * Mapping layer: Prisma rows → `@scrum-poker/types` domain objects.
 *
 * `@scrum-poker/db` is the only package that knows about Prisma's generated
 * types; everything else consumes the framework-agnostic domain types. These
 * mappers translate row shapes into those types, chiefly by:
 * - converting Prisma's `T | null` nullable columns into `T | undefined`
 *   (the domain types use optional `?` properties), and
 * - recursively mapping included relations (`estimations`, `votes`) when they
 *   were loaded.
 *
 * This is intentionally just the row → type surface. The full services layer
 * (queries, transactions, the single-active-estimation invariant) is issue #11.
 */
import type {
  Estimation as DomainEstimation,
  Session as DomainSession,
  Vote as DomainVote,
} from "@scrum-poker/types";

import type {
  Estimation as PrismaEstimation,
  Session as PrismaSession,
  Vote as PrismaVote,
} from "./generated/prisma/client";

/** A `Session` row, optionally with its `estimations` relation loaded. */
export type SessionRow = PrismaSession & {
  estimations?: EstimationRow[];
};

/** An `Estimation` row, optionally with its `votes` relation loaded. */
export type EstimationRow = PrismaEstimation & {
  votes?: VoteRow[];
};

/** A `Vote` row (no further relations to include). */
export type VoteRow = PrismaVote;

/** Normalize Prisma's `T | null` columns to the domain's `T | undefined`. */
function optional<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

/** Map a `Vote` row to the domain {@link DomainVote}. */
export function toVote(row: VoteRow): DomainVote {
  return {
    id: row.id,
    estimationId: row.estimationId,
    voterId: row.voterId,
    voterName: row.voterName,
    voterEmail: row.voterEmail,
    pattern: row.pattern,
    value: optional(row.value),
    createdAt: row.createdAt,
  };
}

/**
 * Map an `Estimation` row to the domain {@link DomainEstimation}. Includes
 * `votes` only when the relation was loaded.
 */
export function toEstimation(row: EstimationRow): DomainEstimation {
  const estimation: DomainEstimation = {
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    description: optional(row.description),
    isActive: row.isActive,
    isEnded: row.isEnded,
    createdAt: row.createdAt,
  };

  if (row.votes !== undefined) {
    estimation.votes = row.votes.map(toVote);
  }

  return estimation;
}

/**
 * Map a `Session` row to the domain {@link DomainSession}. Includes
 * `estimations` only when the relation was loaded.
 */
export function toSession(row: SessionRow): DomainSession {
  const session: DomainSession = {
    id: row.id,
    name: optional(row.name),
    pin: optional(row.pin),
    createdAt: row.createdAt,
    lastUpdated: row.lastUpdated,
  };

  if (row.estimations !== undefined) {
    session.estimations = row.estimations.map(toEstimation);
  }

  return session;
}
