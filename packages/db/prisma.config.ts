// Prisma 7 configuration (replaces the legacy `prisma` key in package.json).
//
// - `import "dotenv/config"` loads DATABASE_URL from a local .env for CLI
//   commands (migrate/seed/studio). The new `prisma-client` generator does NOT
//   load .env at runtime, so the client singleton reads process.env directly.
// - `migrations.seed` wires `prisma db seed` to the tsx seed script.
// - In Prisma 7 the `adapter` config property was removed; driver-adapter
//   migrations work without extra config.
// - We read `process.env.DATABASE_URL` directly (with an empty fallback) rather
//   than Prisma's `env()` helper: `env()` throws when the variable is unset,
//   which would break schema-only commands (`generate`/`validate`/`format`) on
//   a fresh checkout or in CI where no database is configured. DB-connecting
//   commands (`migrate`/`deploy`/`seed`/`studio`) still require a real URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
