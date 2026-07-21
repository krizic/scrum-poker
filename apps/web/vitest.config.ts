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
 */
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "test/**/*.test.ts"],
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
});
