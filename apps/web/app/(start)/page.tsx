import Link from "next/link";
// Type-only import proves apps/web consumes the shared domain types package.
// Real data flows land in later issues (#11 services, #14–#16 routes).
import type { Session } from "@scrum-poker/types";

// Server Component (default). No client JS shipped for the landing page.
export default function StartPage() {
  // Placeholder identity for the not-yet-implemented "create/join by PIN" flow.
  const placeholder: Pick<Session, "name"> = { name: "Scrum Poker" };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full bg-brand/15 px-4 py-1 text-sm font-medium text-brand ring-1 ring-brand/40">
        Next.js 16 migration shell
      </span>

      <h1 className="text-balance text-5xl font-bold tracking-tight">
        {placeholder.name}
      </h1>

      <p className="max-w-prose text-lg text-slate-400">
        Planning poker for agile teams. Create or join a session by PIN, vote on
        estimations, and reveal results in real time.
      </p>

      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/dev"
          className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Developer view
        </Link>
        <Link
          href="/po"
          className="rounded-lg px-5 py-2.5 font-medium text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-800"
        >
          Product Owner view
        </Link>
      </nav>
    </main>
  );
}
