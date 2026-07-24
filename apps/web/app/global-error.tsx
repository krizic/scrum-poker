"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Global error boundary. Next.js renders this (replacing the root layout) when an
// error bubbles up from anywhere in the tree, so it must include <html>/<body>.
// It reports the error to Sentry — the client half of the error path.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-slate-400">
            The error has been reported. Please try again.
          </p>
        </div>
      </body>
    </html>
  );
}
