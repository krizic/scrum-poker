"use client";

/**
 * Client-side "recently accessed sessions" storage.
 *
 * Ports `src/services/local-session-storage.ts` (`LocalSessionApi` /
 * `ISessionAccess`) to the migrated model. It provides the "Recent Sessions"
 * parity list on the Start route so returning users can jump back into a
 * session they created/joined earlier.
 *
 * Field mapping from the legacy `ISessionAccess`:
 *   `_id`          → `id`         (session UUID)
 *   `session_name` → `name`
 *   `session_pin`  → `pin`
 *   `created_at`   → `createdAt`  (epoch ms)
 *
 * Stored under the same localStorage key (`sp_sessions`) as a JSON array, most
 * recent last (matching the legacy append behavior). Kept purely client-side.
 */

/** A locally-remembered session the user has created or joined. */
export interface StoredSession {
  id: string;
  name?: string;
  pin?: string;
  /** Epoch milliseconds, matching the legacy `created_at`. */
  createdAt: number;
}

/** localStorage key — identical to the legacy `sessionKey` for continuity. */
export const SESSIONS_KEY = "sp_sessions";

/** Read all remembered sessions, or `null` when none/unavailable (legacy parity). */
export function getRecentSessions(): StoredSession[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : null;
  } catch {
    return null;
  }
}

/**
 * Remember a session (append). De-duplicates by `id` so re-entering an existing
 * session refreshes its entry instead of stacking duplicates.
 */
export function saveRecentSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  const existing = getRecentSessions() ?? [];
  const deduped = existing.filter((s) => s.id !== session.id);
  window.localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify([...deduped, session]),
  );
}

/** Forget a remembered session by id. Mirrors legacy `deleteSession`. */
export function deleteRecentSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  const existing = getRecentSessions();
  if (!existing?.length) return;
  window.localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify(existing.filter((s) => s.id !== sessionId)),
  );
}
