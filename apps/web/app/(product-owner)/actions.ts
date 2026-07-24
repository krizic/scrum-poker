"use server";

/**
 * Product-Owner-route Server Actions — the DB-touching estimation management
 * calls behind `/po`.
 *
 * These replace the legacy PouchDB `ApiService` calls in
 * `src/pages/po-page.tsx` (`createNewEstimation`, `updateEstimation`,
 * `deleteEstimation`, `importEstimations`) + the estimation controls in
 * `src/components/estimations/*`. They delegate to the Prisma-backed services in
 * `apps/web/lib/server/services` (`createEstimation`, `activateEstimation`,
 * `updateEstimation`, `deleteEstimation`, `importEstimations`, `getSession`).
 *
 * Split of responsibilities (mirrors `/dev`'s `actions.ts`):
 * - The client island (`po-room.tsx`) owns the SSE subscription and the current
 *   session state; it renders the reusable `@scrum-poker/components` and wires
 *   their callbacks to these actions.
 * - These actions own the writes/reads that must run on the server. Every write
 *   flows through the shared Prisma client, so the `pg_notify` DB triggers in
 *   `@scrum-poker/db` fire and fan out over SSE (#12). That is exactly what makes
 *   a PO action (e.g. activating an estimation) switch `/dev` live for every
 *   connected developer, and what streams incoming votes back to the PO stats.
 *
 * We return plain, serializable results (never `redirect()`); the island decides
 * how to reflect success / surface errors (toast).
 */

import { getPublicJoinUrl, type PublicJoinUrlResult } from "@/lib/server/public-join-url";
import {
    activateEstimation,
    createEstimation,
    deleteEstimation,
    getSession,
    importEstimations,
    updateEstimation,
    type CreateEstimationInput,
    type UpdateEstimationInput,
} from "@/lib/server/services";
import type { Estimation, Session } from "@scrum-poker/types";
import type { ImportedEstimation } from "@scrum-poker/utils";

/** Discriminated result so the island can toast on error without throwing. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Create a new estimation round in the session (name + optional description).
 * Replaces legacy `ApiService.createNewEstimation`. The insert fires the
 * `pg_notify` trigger → SSE, so the round appears live for any other PO tab.
 */
export async function createEstimationAction(
  sessionId: string,
  input: CreateEstimationInput,
): Promise<ActionResult<Estimation>> {
  const name = input.name?.trim();
  if (!name) {
    return { ok: false, error: "Please give the estimation a name." };
  }

  try {
    const estimation = await createEstimation(sessionId, {
      name,
      description: input.description?.trim() || undefined,
    });
    return { ok: true, data: estimation };
  } catch (err) {
    console.error("createEstimationAction failed", { sessionId }, err);
    return { ok: false, error: "Could not create the estimation." };
  }
}

/**
 * Activate one estimation (start voting). The service enforces the single-active
 * invariant transactionally — every other estimation in the session is set
 * inactive. The resulting `pg_notify` is what makes `/dev` switch to the newly
 * active round live for all connected developers.
 */
export async function activateEstimationAction(
  sessionId: string,
  estimationId: string,
): Promise<ActionResult<Estimation>> {
  if (!estimationId) {
    return { ok: false, error: "No estimation selected." };
  }

  try {
    const estimation = await activateEstimation(sessionId, estimationId);
    return { ok: true, data: estimation };
  } catch (err) {
    console.error("activateEstimationAction failed", { sessionId, estimationId }, err);
    return { ok: false, error: "Could not start the estimation." };
  }
}

/**
 * Patch an estimation's scalar fields — rename / edit description, and/or
 * end/reveal the round (`isEnded: true`). Replaces the non-activation half of the
 * legacy `ApiService.updateEstimation`. Ending a round reveals every developer's
 * card over SSE (and unlocks the PO stats/chart).
 */
export async function updateEstimationAction(
  estimationId: string,
  input: UpdateEstimationInput,
): Promise<ActionResult<Estimation>> {
  if (!estimationId) {
    return { ok: false, error: "No estimation selected." };
  }

  const patch: UpdateEstimationInput = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      return { ok: false, error: "The estimation name can't be empty." };
    }
    patch.name = name;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.isEnded !== undefined) {
    patch.isEnded = input.isEnded;
  }

  try {
    const estimation = await updateEstimation(estimationId, patch);
    return { ok: true, data: estimation };
  } catch (err) {
    console.error("updateEstimationAction failed", { estimationId }, err);
    return { ok: false, error: "Could not update the estimation." };
  }
}

/**
 * Delete an estimation (cascades to its votes). Replaces legacy
 * `ApiService.deleteEstimation`.
 */
export async function deleteEstimationAction(
  estimationId: string,
): Promise<ActionResult<null>> {
  if (!estimationId) {
    return { ok: false, error: "No estimation selected." };
  }

  try {
    await deleteEstimation(estimationId);
    return { ok: true, data: null };
  } catch (err) {
    console.error("deleteEstimationAction failed", { estimationId }, err);
    return { ok: false, error: "Could not delete the estimation." };
  }
}

/**
 * Bulk-import estimations parsed client-side from a CSV (see `ImportZone` →
 * `parseEstimationsCsv` in `@scrum-poker/utils`). Replaces legacy
 * `ApiService.importEstimations`. Returns the created rows so the island can
 * report how many were added.
 */
export async function importEstimationsAction(
  sessionId: string,
  rows: readonly ImportedEstimation[],
): Promise<ActionResult<Estimation[]>> {
  if (!rows.length) {
    return { ok: false, error: "That CSV had no estimations to import." };
  }

  try {
    const created = await importEstimations(sessionId, rows);
    return { ok: true, data: created };
  } catch (err) {
    console.error("importEstimationsAction failed", { sessionId }, err);
    return { ok: false, error: "Could not import the estimations." };
  }
}

/**
 * Re-fetch the full session graph (estimations + votes). The SSE stream only
 * carries tiny change descriptors, so the client island calls this on every
 * `change` event to converge on fresh server state — reproducing the legacy
 * PouchDB `onChange` → re-fetch loop 1:1. Returns `null` if the session was
 * deleted, so the island can drop into a not-found state.
 */
export async function getSessionAction(id: string): Promise<Session | null> {
  return getSession(id);
}

/**
 * Resolve the public developer-join URL for the "Public QR invite" feature
 * (PO session header). See `lib/server/public-join-url.ts` for the mode
 * selection (`PUBLIC_JOIN_URL_MODE=ngrok|local`) and resolution logic; this
 * is a thin wrapper matching the other Server Actions in this file.
 */
export async function getPublicJoinUrlAction(
  sessionId: string,
): Promise<PublicJoinUrlResult> {
  return getPublicJoinUrl(sessionId);
}
