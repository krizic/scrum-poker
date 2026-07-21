import type { Metadata } from "next";
// Type-only import proves apps/web consumes the shared domain types package.
import type { Session } from "@scrum-poker/types";
import { StartClient } from "./start-client";

export const metadata: Metadata = {
  title: "Scrum Poker — Start",
  description:
    "Create or join a planning-poker session and set up your local identity.",
};

/**
 * Start route (`/`) — replaces the legacy `src/pages/start.tsx` (+ `start.scss`).
 *
 * A Server Component shell (no client JS for the header/copy) that renders the
 * `StartClient` island where interactivity + localStorage identity live. The
 * DB-touching create/join calls run in Server Actions (`./actions.ts`); the
 * island navigates to `/dev?session=<id>` / `/po?session=<id>` on success
 * (contract in `@/lib/session-route`).
 */
export default function StartPage() {
  const appName: Pick<Session, "name">["name"] = "Scrum Poker";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-section px-6 py-12 text-content">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-brand/15 px-4 py-1 text-sm font-medium text-brand ring-1 ring-brand/40">
          Planning poker
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight">
          {appName}
        </h1>
        <p className="max-w-prose text-muted">
          Create or join a session, set your identity, and enter as a Developer
          or Product Owner.
        </p>
      </header>

      <StartClient />
    </main>
  );
}
