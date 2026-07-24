"use server";

/**
 * Start-route Server Actions — the DB-touching create/join calls.
 *
 * These replace the legacy `ApiService.post` (create) and the PIN-based lookup
 * from `src/pages/start.tsx`, delegating to the Prisma-backed services in
 * `apps/web/lib/server/services` (`createSession`, `getSessionByPin`,
 * `getSession`). They are the server half of the create/join flow; the client
 * island (`start-client.tsx`) persists identity + recent-session to localStorage
 * and performs the navigation (so we return a plain, serializable result rather
 * than `redirect()`-ing here — the client must write localStorage first, and the
 * target URL is derived from the shared `sessionHref` contract).
 *
 * Every write flows through the shared Prisma client, so the `pg_notify` triggers
 * in `@scrum-poker/db` fire and feed the SSE layer (#12) automatically.
 */

import {
  createSession,
  getSession,
  getSessionByPin,
} from "@/lib/server/services";

/** A JSON-safe session summary handed back to the client island. */
export interface SessionSummary {
  id: string;
  name: string | null;
  pin: string | null;
  /** ISO string — `Date` serialized for the client boundary. */
  createdAt: string;
}

/** Discriminated result so the client can navigate on success / toast on error. */
export type ActionResult =
  | { ok: true; session: SessionSummary }
  | { ok: false; error: string };

function toSummary(session: {
  id: string;
  name?: string;
  pin?: string;
  createdAt: Date;
}): SessionSummary {
  return {
    id: session.id,
    name: session.name ?? null,
    pin: session.pin ?? null,
    createdAt: session.createdAt.toISOString(),
  };
}

export interface CreateSessionActionInput {
  name?: string;
  pin?: string;
}

/**
 * Create a new session (optional name + PIN). Mirrors legacy `ApiService.post`;
 * both fields are optional in the schema/service. Trims inputs and treats empty
 * strings as "unset".
 */
export async function createSessionAction(
  input: CreateSessionActionInput,
): Promise<ActionResult> {
  const name = input.name?.trim() || undefined;
  const pin = input.pin?.trim() || undefined;

  try {
    const session = await createSession({ name, pin });
    return { ok: true, session: toSummary(session) };
  } catch (err) {
    console.error("createSessionAction failed", err);
    return { ok: false, error: "Could not create the session. Please try again." };
  }
}

/**
 * Join an existing session by PIN (and/or id). PIN lookup uses
 * `getSessionByPin` (most-recent match wins, per the service); an explicit `id`
 * takes precedence and uses `getSession`. Returns a user-facing error when the
 * session is not found (the client shows it via toast + inline `role="alert"`).
 */
export async function joinSessionAction(input: {
  pin?: string;
  id?: string;
}): Promise<ActionResult> {
  const pin = input.pin?.trim();
  const id = input.id?.trim();

  if (!pin && !id) {
    return { ok: false, error: "Enter a session PIN to join." };
  }

  try {
    const session = id
      ? await getSession(id)
      : await getSessionByPin(pin as string);

    if (!session) {
      return { ok: false, error: "No session found for that PIN." };
    }
    return { ok: true, session: toSummary(session) };
  } catch (err) {
    console.error("joinSessionAction failed", err);
    return { ok: false, error: "Could not join the session. Please try again." };
  }
}
