import type { Metadata } from "next";
import Link from "next/link";

import { getSession, getSessionMeta } from "@/lib/server/services";
import { isSessionUnlocked } from "@/lib/server/session-unlock";
import { readSessionParam } from "@/lib/session-route";
import { DevRoom } from "../dev-room";
import { DevPinGate } from "../dev-pin-gate";

export const metadata: Metadata = {
  title: "Scrum Poker — Developer",
  description: "Vote on the active estimation; updates live as others vote.",
};

/**
 * Developer route (`/dev`) — replaces legacy `src/pages/developer.tsx`
 * (+ `developer.scss`) and the PouchDB wiring in
 * `src/components/dev-estimation/*`.
 *
 * Server Component shell: reads the active session id from `?session=<id>`
 * (async `searchParams` in Next 16 — awaited). Developers reach this route via
 * the invite link the Product Owner shares. If the session has a PIN and this
 * browser hasn't unlocked it yet, a PIN gate (`DevPinGate`) is shown BEFORE the
 * session graph is loaded — the votes/estimations and the PIN itself are never
 * sent to the browser until the gate passes. Once unlocked (or when the session
 * has no PIN) the full graph is loaded server-side so first paint is real data,
 * and interactivity lives in the `DevRoom` client island.
 *
 * States handled here:
 * - No `?session` → prompt the user back to Start.
 * - Session not found → friendly not-found with a link to `/`.
 * - PIN required and not unlocked → render `DevPinGate`.
 * - Found + open/unlocked → render the voting island.
 */
export default async function DeveloperPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionId = readSessionParam(await searchParams);
  const meta = sessionId ? await getSessionMeta(sessionId) : null;
  const locked = Boolean(meta?.hasPin) && !(await isSessionUnlocked(sessionId!));
  const session = meta && !locked ? await getSession(sessionId!) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-section px-6 py-12 text-content">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-brand/15 px-4 py-1 text-sm font-medium text-brand ring-1 ring-brand/40">
          Developer
        </span>
        <h1 className="text-balance text-3xl font-bold tracking-tight">
          Cast your vote
        </h1>
      </header>

      {!sessionId ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted">
            No session selected. Ask your Product Owner for an invite link.
          </p>
          <Link
            href="/"
            className="text-brand underline-offset-4 hover:underline"
          >
            Go to Start
          </Link>
        </div>
      ) : !meta ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted">
            We couldn&rsquo;t find session{" "}
            <span className="font-mono">{sessionId}</span>. It may have ended.
          </p>
          <Link
            href="/"
            className="text-brand underline-offset-4 hover:underline"
          >
            &larr; Back to start
          </Link>
        </div>
      ) : locked ? (
        <DevPinGate sessionId={sessionId} sessionName={meta.name} />
      ) : session ? (
        <DevRoom sessionId={sessionId} initialSession={session} />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted">
            We couldn&rsquo;t load this session. It may have ended.
          </p>
          <Link
            href="/"
            className="text-brand underline-offset-4 hover:underline"
          >
            &larr; Back to start
          </Link>
        </div>
      )}
    </main>
  );
}
