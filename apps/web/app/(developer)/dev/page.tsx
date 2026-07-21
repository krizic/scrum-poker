import Link from "next/link";

// Placeholder for the Developer route. Real voting UI + SSE live updates land in
// issue #15 (route) building on #12 (SSE) and #13 (components).
export default function DeveloperPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Developer</h1>
      <p className="text-slate-400">
        Voting on the active estimation will live here.
      </p>
      <Link href="/" className="text-brand underline-offset-4 hover:underline">
        &larr; Back to start
      </Link>
    </main>
  );
}
