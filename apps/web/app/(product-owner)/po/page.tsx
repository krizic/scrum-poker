import type { Metadata } from "next";
import Link from "next/link";

import { getSession } from "@/lib/server/services";
import { readSessionParam } from "@/lib/session-route";
import { PoRoom } from "../po-room";

export const metadata: Metadata = {
  title: "Scrum Poker — Product Owner",
  description:
    "Create and manage estimations, reveal votes, view stats, and import from CSV.",
};

/**
 * Product Owner route (`/po`) — replaces legacy `src/pages/po-page.tsx`
 * (+ `po-page.scss`) and the PouchDB wiring in
 * `src/components/{estimations,est-statistics,estimation-chart,card-reveal,
 * votes-table,import-zone}`.
 *
 * Server Component shell (mirrors `/dev`'s `dev/page.tsx`): reads the active
 * session id from `?session=<id>` (async `searchParams` in Next 16 — awaited) and
 * loads the full session graph server-side so first paint is real data. All
 * interactivity — the SSE live loop, estimation management, reveal/stats/chart,
 * CSV import, and the share surface — lives in the `PoRoom` client island, seeded
 * with the loaded session.
 *
 * States handled here:
 * - No `?session` → prompt the user back to Start (they must create/join first).
 * - `getSession(id)` returns null → friendly not-found with a link to `/`.
 * - Found → render the management island.
 */
export default async function ProductOwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionId = readSessionParam(await searchParams);
  const session = sessionId ? await getSession(sessionId) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-section px-6 py-12 text-content">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-brand/15 px-4 py-1 text-sm font-medium text-brand ring-1 ring-brand/40">
          Product Owner
        </span>
        <h1 className="text-balance text-3xl font-bold tracking-tight">
          Manage estimations
        </h1>
      </header>

      {!sessionId ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted">
            No session selected. Start or join one first.
          </p>
          <Link
            href="/"
            className="text-brand underline-offset-4 hover:underline"
          >
            Go to Start
          </Link>
        </div>
      ) : !session ? (
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
      ) : (
        <PoRoom sessionId={sessionId} initialSession={session} />
      )}
    </main>
  );
}
