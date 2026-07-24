"use server";

/**
 * Developer-route Server Actions — the DB-touching vote + revalidation calls.
 *
 * These replace the legacy PouchDB `ApiService.vote` / `ApiService.getSession`
 * calls in `src/pages/developer.tsx` + `src/components/dev-estimation/*`. They
 * delegate to the Prisma-backed services in `apps/web/lib/server/services`
 * (`castVote`, `getSession`).
 *
 * Split of responsibilities (mirrors the Start route's `actions.ts`):
 * - The client island (`dev-room.tsx`) owns identity (localStorage), the SSE
 *   subscription, and current session state.
 * - These actions own the writes/reads that must run on the server. The vote
 *   write flows through the shared Prisma client, so the `pg_notify` DB triggers
 *   in `@scrum-poker/db` fire and fan out over SSE (#12) — that is what makes
 *   every participant's view converge in real time.
 *
 * We return plain, serializable results (never `redirect()`); the island decides
 * how to reflect success (optimistic selection) / surface errors (toast).
 */

import {
  castVote,
  getSession,
  verifySessionPin,
  VOTING_CLOSED_ERROR,
} from "@/lib/server/services";
import { markSessionUnlocked } from "@/lib/server/session-unlock";
import type { CardValue, Session, UserInfo } from "@scrum-poker/types";

/** Discriminated result so the island can toast on error without throwing. */
export type CastVoteResult =
  | { ok: true; value: CardValue | null }
  | { ok: false; error: string };

/** Result of a developer PIN join attempt. */
export type JoinSessionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Verify a developer-supplied PIN for the invite-link join gate. On success it
 * sets an httpOnly unlock cookie (see `lib/server/session-unlock`) so the `/dev`
 * server component loads the session graph on the next render. The PIN is only
 * ever compared server-side and never returned to the client.
 */
export async function verifySessionPinAction(
  sessionId: string,
  pin: string,
): Promise<JoinSessionResult> {
  if (!sessionId) {
    return { ok: false, error: "No session selected." };
  }
  try {
    const ok = await verifySessionPin(sessionId, pin);
    if (!ok) {
      return { ok: false, error: "That PIN is incorrect." };
    }
    await markSessionUnlocked(sessionId);
    return { ok: true };
  } catch (err) {
    console.error("verifySessionPinAction failed", { sessionId }, err);
    return { ok: false, error: "Could not verify the PIN. Please try again." };
  }
}

/**
 * Cast or change the current developer's vote on the active estimation.
 *
 * `value` is optional: omitting it registers the voter's presence without
 * revealing (or overwriting) a card — the upsert leaves an existing value
 * untouched, exactly matching the legacy `ApiService.vote` guard.
 *
 * @param sessionId - the active session (carried for context/logging; the write
 *   is keyed by `estimationId`, and the resulting `pg_notify` targets this
 *   session's SSE channel).
 * @param estimationId - the active estimation being voted on.
 * @param userInfo - client identity (mapped to `voterId`/`voterName`/…).
 * @param value - optional card value; omit to register presence / keep existing.
 */
export async function castVoteAction(
  sessionId: string,
  estimationId: string,
  userInfo: UserInfo,
  value?: CardValue,
): Promise<CastVoteResult> {
  if (!estimationId) {
    return { ok: false, error: "No active estimation to vote on." };
  }
  if (!userInfo?.id) {
    return { ok: false, error: "Missing identity — please sign in again." };
  }

  try {
    const vote = await castVote(estimationId, userInfo, value);
    return { ok: true, value: vote.value ?? null };
  } catch (err) {
    if (err instanceof Error && err.message === VOTING_CLOSED_ERROR) {
      return {
        ok: false,
        error: "Voting is closed — the product owner ended this round.",
      };
    }
    console.error("castVoteAction failed", { sessionId, estimationId }, err);
    return { ok: false, error: "Could not record your vote. Please try again." };
  }
}

/**
 * Re-fetch the full session graph (estimations + votes). The SSE stream only
 * carries tiny change descriptors, so the client island calls this on every
 * `change` event to converge on fresh server state — reproducing the legacy
 * PouchDB `onChange` → re-fetch behavior 1:1. Returns `null` if the session was
 * deleted, so the island can drop into a not-found state.
 */
export async function getSessionAction(id: string): Promise<Session | null> {
  return getSession(id);
}
