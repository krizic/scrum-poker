// Sentry initialization for the browser (client) runtime. Loaded automatically
// by Next.js from the root `instrumentation-client` file — no manual import.
//
// Uses NEXT_PUBLIC_SENTRY_DSN (browser-exposed). With no DSN set the SDK is
// disabled, so local/dev builds never send events to Sentry.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

// Instruments App Router client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
