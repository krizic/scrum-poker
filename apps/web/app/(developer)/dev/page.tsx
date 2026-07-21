import Link from "next/link";
import { readSessionParam } from "@/lib/session-route";

/**
 * Developer route (`/dev`) — minimal placeholder for issue #14.
 *
 * The full voting UI + SSE live updates land in issue #15. For now this page
 * establishes and consumes the session-id contract set on the Start route: the
 * active session id arrives as `?session=<id>` (see `@/lib/session-route`).
 * `searchParams` is async in Next 16, so we await it.
 */
export default async function DeveloperPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionId = readSessionParam(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center text-content">
      <h1 className="text-3xl font-bold tracking-tight">Developer</h1>
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
        Voting on the active estimation will live here (issue #15).
      </p>
      <Link href="/" className="text-brand underline-offset-4 hover:underline">
        &larr; Back to start
      </Link>
    </main>
  );
}
