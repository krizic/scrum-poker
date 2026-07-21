import { defineConfig } from "vitest/config";
import { reactTestConfig } from "@scrum-poker/config/vitest";

/**
 * Vitest config for `@scrum-poker/ui`. Inherits the shared jsdom + Testing
 * Library setup (matchers + auto-cleanup) from `@scrum-poker/config/vitest`;
 * we only scope the test glob to this package's `src`.
 */
export default defineConfig(
  reactTestConfig({
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
    },
  }),
);
