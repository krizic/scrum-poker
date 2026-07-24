// Sentry initialization for the Node.js server runtime. Imported lazily by
// `instrumentation.ts` when NEXT_RUNTIME === "nodejs".
//
// Uses the server-only SENTRY_DSN (falls back to the public DSN if that is all
// that is configured). Disabled when no DSN is present.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});
