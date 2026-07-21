import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Long-lived Node server output for the Docker deploy (issue #17) and, later,
  // the SSE / LISTEN-NOTIFY realtime transport (issue #12).
  output: "standalone",

  // Pin the workspace root so Turbopack/standalone tracing don't get confused by
  // unrelated lockfiles elsewhere on the machine. This is the monorepo root.
  turbopack: {
    root: path.join(import.meta.dirname, "..", ".."),
  },

  // Workspace packages ship raw TypeScript sources (see their `exports` maps),
  // so Next must transpile them rather than treat them as prebuilt deps.
  transpilePackages: ["@scrum-poker/types", "@scrum-poker/db"],
};

// Wrap with Sentry so server-side + edge instrumentation and (optional) source
// map upload are configured. Source map upload is skipped unless SENTRY_AUTH_TOKEN
// is present, so this stays offline/no-op without secrets.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only print source-map upload logs in CI.
  silent: !process.env.CI,
  // Never phone home during scaffolding/builds without an opted-in DSN + token.
  telemetry: false,
});
