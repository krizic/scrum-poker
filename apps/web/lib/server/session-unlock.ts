import "server-only";

import { cookies } from "next/headers";

/**
 * Developer join gate — cookie helpers.
 *
 * When a session has a PIN, developers arriving via the invite link
 * (`/dev?session=<id>`) must prove they know the PIN before the session graph
 * is loaded. On a successful check the server sets a short-lived, httpOnly
 * cookie so the graph loads on the next render. httpOnly means client JS can't
 * forge it; the PIN itself never reaches the browser during the gate.
 */

/** Cookie name for an unlocked session. Session ids are UUIDs (cookie-safe). */
export function unlockCookieName(sessionId: string): string {
  return `sp_unlocked_${sessionId}`;
}

/** How long an unlock lasts before the developer is asked for the PIN again. */
const UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

/** Mark a session as unlocked for this browser (called after a valid PIN). */
export async function markSessionUnlocked(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(unlockCookieName(sessionId), "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE_SECONDS,
  });
}

/** Whether this browser has already unlocked the given session. */
export async function isSessionUnlocked(sessionId: string): Promise<boolean> {
  const store = await cookies();
  return store.get(unlockCookieName(sessionId))?.value === "1";
}
