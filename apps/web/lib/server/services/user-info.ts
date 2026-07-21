/**
 * Client identity → `Vote` field mapping.
 *
 * Replaces the localStorage-coupled `IUserInfo` → vote path in the legacy
 * `ApiService.vote` (`src/api/index.ts`). The legacy code wrote
 * `{ id, voter_username, voter_email, pattern }` straight off the client's
 * `IUserInfo`; here we map the ported {@link UserInfo} onto the normalized
 * `Vote` columns (`voterId`/`voterName`/`voterEmail`/`pattern`).
 *
 * This module is intentionally **pure** (no Prisma, no `server-only`) so the
 * mapping can be unit-tested without a database. The service modules that
 * actually write to the DB are `server-only`.
 *
 * Client-storage semantics are mirrored from `src/services/local-user-storage.ts`:
 * only the identity `id` is strictly required; the display fields are optional
 * on the client and default to empty strings on the server, matching the
 * non-optional `Vote` columns.
 */
import type { UserInfo } from "@scrum-poker/types";

/** The subset of `Vote` columns derived from a client identity. */
export interface VoteIdentity {
  voterId: string;
  voterName: string;
  voterEmail: string;
  pattern: string;
}

/**
 * Map a client {@link UserInfo} onto the `Vote` identity columns.
 *
 * @throws {Error} when `userInfo.id` is missing — a vote cannot be attributed
 *   to an anonymous identity, and `id` backs the `(estimationId, voterId)`
 *   uniqueness that enforces one vote per user per estimation.
 */
export function toVoteIdentity(userInfo: UserInfo): VoteIdentity {
  if (!userInfo.id) {
    throw new Error("Cannot cast a vote without a userInfo.id (voter identity).");
  }

  return {
    voterId: userInfo.id,
    voterName: userInfo.username ?? "",
    voterEmail: userInfo.email ?? "",
    pattern: userInfo.pattern ?? "",
  };
}
