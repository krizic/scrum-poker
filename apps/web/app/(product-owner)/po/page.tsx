import Link from "next/link";

// Placeholder for the Product Owner route. Estimation management, reveal, stats
// (@nivo/pie) and CSV import (papaparse) land in issue #16, building on #12/#13.
export default function ProductOwnerPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Product Owner</h1>
      <p className="text-slate-400">
        Manage estimations, reveal votes, and view stats here.
      </p>
      <Link href="/" className="text-brand underline-offset-4 hover:underline">
        &larr; Back to start
      </Link>
    </main>
  );
}
