// Shared Vitest config factory for the scrum-poker monorepo.
//
// Component/route packages import this via `@scrum-poker/config/vitest` and
// spread the result into `defineConfig`, so they inherit the jsdom environment,
// the Testing Library matchers + auto-cleanup (see `vitest-setup.ts`), without
// duplicating boilerplate:
//
//   import { defineConfig } from "vitest/config";
//   import { reactTestConfig } from "@scrum-poker/config/vitest";
//
//   export default defineConfig(
//     reactTestConfig({ test: { include: ["src/**/*.test.{ts,tsx}"] } }),
//   );
//
// The setup file path is resolved absolutely (relative to this module) so it
// works regardless of the consuming package's working directory.
import { fileURLToPath, URL } from "node:url";

const setupFile = fileURLToPath(new URL("./vitest-setup.ts", import.meta.url));

/**
 * Build a Vitest config object for React render tests (jsdom + Testing Library).
 *
 * @param {object} [overrides] Partial Vitest config. Anything under `test` is
 *   merged over the shared defaults; any `test.setupFiles` you pass are appended
 *   after the shared setup file (they don't replace it).
 * @returns {object} A config object to hand to `defineConfig`.
 */
export function reactTestConfig(overrides = {}) {
  const { test: testOverrides = {}, ...rest } = overrides;
  const { setupFiles = [], ...restTest } = testOverrides;

  return {
    ...rest,
    test: {
      environment: "jsdom",
      // Testing Library relies on a global `afterEach` to auto-register its
      // per-test `cleanup()`; enabling `globals` provides it (and lets tests use
      // `expect`/`describe`/`it` without importing them).
      globals: true,
      css: false,
      ...restTest,
      setupFiles: [setupFile, ...setupFiles],
    },
  };
}
