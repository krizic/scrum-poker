// Bootstraps the local development environment files from their committed
// `.env.example` templates. Idempotent: existing files are left untouched so a
// developer's local overrides are never clobbered.
//
// Why two files? Prisma CLI commands (migrate/seed/studio) read `.env` from the
// @scrum-poker/db package (via dotenv in prisma.config.ts), while the Next.js
// dev server reads `.env.local` from apps/web. Both need DATABASE_URL, so we
// seed both from their respective examples with the same local default
// (postgres@localhost:5432/scrumpoker — matches docker-compose's `db` service).
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** [source template, destination] pairs, relative to the repo root. */
const files = [
  ["apps/web/.env.example", "apps/web/.env.local"],
  ["packages/db/.env.example", "packages/db/.env"],
];

let created = 0;
for (const [src, dest] of files) {
  const from = join(root, src);
  const to = join(root, dest);
  if (existsSync(to)) {
    console.log(`  exists   ${dest}`);
    continue;
  }
  if (!existsSync(from)) {
    console.warn(`  skip     ${dest} (missing template ${src})`);
    continue;
  }
  copyFileSync(from, to);
  created += 1;
  console.log(`  created  ${dest}  (from ${src})`);
}

console.log(
  created > 0
    ? `\nLocal env ready. ${created} file(s) created — edit DATABASE_URL if your Postgres differs.`
    : "\nLocal env already set up. Nothing to do.",
);
