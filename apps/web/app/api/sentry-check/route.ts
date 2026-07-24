// Test error path for the server-side Sentry integration. Hitting
// GET /api/sentry-check throws, which Next.js reports through the
// `onRequestError` hook wired in instrumentation.ts. With no DSN configured the
// SDK is disabled and nothing is sent — it only proves the plumbing exists.
export function GET() {
  throw new Error("Sentry check: intentional server error from /api/sentry-check");
}
