// Next.js instrumentation hook. Runs once per server runtime (Node & Edge) at
// startup and wires up Sentry for the correct runtime. This is the current
// (@sentry/nextjs) convention — no `sentry.server.config` import at the top level.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in nested React Server Components / route handlers.
export const onRequestError = Sentry.captureRequestError;
