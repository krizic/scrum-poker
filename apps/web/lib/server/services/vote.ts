/**
 * Vote data-access service (server-only).
 *
 * Prisma-backed replacement for `ApiService.vote` (`src/api/index.ts`). The
 * legacy method stored votes in a map keyed by the voter's id inside the
 * estimation document, with this guard:
 *
 *   if ((!vote && !estimation.votes[userInfo.id]) || vote) { ...write... }
 *
 * i.e. write when a card value is provided (create or change the vote), or when
 * no value is provided *and the user has not voted yet* (register presence).
 * Crucially, when no value is provided and the user has already voted, the
 * existing value is left untouched.
 *
 * This maps cleanly onto a Prisma `upsert` on the `(estimationId, voterId)`
 * unique key:
 * - `create` inserts a presence/first vote (with `value` possibly `undefined`),
 * - `update` refreshes identity fields; because Prisma treats an `undefined`
 *   field as "leave unchanged", passing no value never clears a prior vote —
 *   exactly matching the legacy guard — while passing a value changes it.
 *
 * One row per `(estimationId, voterId)` is guaranteed by the `@@unique`
 * constraint, so a re-vote updates in place instead of inserting a duplicate.
 *
 * The write goes through the shared Prisma client, so the `pg_notify` triggers
 * in `@scrum-poker/db` fire automatically and feed the SSE layer (issue #12).
 */
import "server-only";

import { prisma, toVote } from "@scrum-poker/db";
import type { CardValue, UserInfo, Vote } from "@scrum-poker/types";

import { toVoteIdentity } from "./user-info";

/**
 * Thrown by {@link castVote} when a developer tries to cast or change a card
 * value on a round the product owner has already ended. Callers (e.g. the
 * `castVoteAction` Server Action) can detect it to surface a precise message.
 */
export const VOTING_CLOSED_ERROR = "VOTING_CLOSED";

/**
 * Cast or change a vote. `value` is optional: omitting it registers the voter's
 * presence without revealing (or overwriting) a card.
 *
 * @param estimationId - target estimation.
 * @param userInfo - client identity (mapped to `voterId`/`voterName`/… ).
 * @param value - optional card value; omit to register presence / keep existing.
 * @throws when a card `value` is provided for an estimation that is already
 *   ended (`isEnded`) — voting is closed once the PO reveals the round.
 */
export async function castVote(
  estimationId: string,
  userInfo: UserInfo,
  value?: CardValue,
): Promise<Vote> {
  const identity = toVoteIdentity(userInfo);

  // Guard: once the PO ends the round, developers can no longer cast or change
  // a card value (the deck is also locked client-side). Presence pings (no
  // value) are left untouched so late joiners can still be registered.
  if (value !== undefined) {
    const estimation = await prisma.estimation.findUnique({
      where: { id: estimationId },
      select: { isEnded: true },
    });
    if (estimation?.isEnded) {
      throw new Error(VOTING_CLOSED_ERROR);
    }
  }

  const row = await prisma.vote.upsert({
    where: {
      estimationId_voterId: {
        estimationId,
        voterId: identity.voterId,
      },
    },
    create: {
      estimationId,
      ...identity,
      value,
    },
    // `value: undefined` here means "do not change the stored value", mirroring
    // the legacy guard that never clears an existing vote when no value is sent.
    update: {
      ...identity,
      value,
    },
  });

  return toVote(row);
}
