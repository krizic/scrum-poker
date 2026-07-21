import Link from "next/link";
import { readSessionParam } from "@/lib/session-route";

/**
 * Product Owner route (`/po`) — minimal placeholder for issue #14.
 *
 * Estimation management, reveal, stats (@nivo/pie) and CSV import land in issue
 * #16. For now this page consumes the session-id contract set on the Start
 * route: the active session id arrives as `?session=<id>` (see
 * `@/lib/session-route`). `searchParams` is async in Next 16, so we await it.
 */
export default async function ProductOwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionId = readSessionParam(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center text-content">
      <h1 className="text-3xl font-bold tracking-tight">Product Owner</h1>
      {sessionId ? (
        <p className="text-muted" aria-live="polite">
          Loading session <span className="font-mono">{sessionId}</span>…
        </p>
      ) : (
        <p className="text-muted">
          No session selected. Start or join one first.
        </p>
      )}
      <p className="text-sm text-muted">
        Manage estimations, reveal votes, and view stats here (issue #16).
      </p>
      <Link href="/" className="text-brand underline-offset-4 hover:underline">
        &larr; Back to start
      </Link>
    </main>
  );
}
