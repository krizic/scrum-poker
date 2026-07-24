import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for `@scrum-poker/web`.
 *
 * The service layer under `lib/server/services` imports `server-only` so it can
 * never leak into a client bundle. That package's `default` export intentionally
 * throws when imported outside a React Server Components graph, so under Vitest
 * (plain Node) we alias it to a harmless no-op stub. This lets the DB-invariant
 * and pure-mapping tests import the real service modules unchanged.
 *
 * `app/**\/*.test.tsx` component tests (e.g. `po-room`'s `QrInviteButton`) need a
 * browser-like DOM, so those files run under `jsdom` via `environmentMatchGlobs`
 * while everything else (the DB-touching `test/**` and pure `lib/**` tests)
 * keeps the default `node` environment. `@scrum-poker/config/vitest-setup`
 * registers the shared `@testing-library/jest-dom` matchers.
 *
 * This app's `tsconfig.json` sets `"jsx": "preserve"` (Next.js's own SWC
 * compiler does the real transform at build time), but esbuild (which Vitest
 * uses to transform test files) reads that same tsconfig and falls back to
 * the classic `React.createElement` transform for it — which throws
 * `ReferenceError: React is not defined` in any `.tsx` test that doesn't
 * explicitly `import React`. Forcing the automatic runtime here keeps `.tsx`
 * tests consistent with the rest of the monorepo (every other package's
 * tsconfig already sets `"jsx": "react-jsx"`).
 */
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["lib/**/*.test.ts", "test/**/*.test.ts", "app/**/*.test.tsx"],
    environment: "node",
    environmentMatchGlobs: [["app/**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["@scrum-poker/config/vitest-setup"],
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
      // Mirror the tsconfig `@/*` path alias so tests can import app code
      // (e.g. Server Actions under `app/`) the same way the app does.
      "@/": `${fileURLToPath(new URL(".", import.meta.url))}`,
    },
  },
});
