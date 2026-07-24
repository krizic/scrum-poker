import base from "@scrum-poker/config/eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    // Prisma-generated client and raw SQL migrations are machine-authored.
    ignores: ["src/generated/**", "prisma/migrations/**", "dist/**"],
  },
  ...base,
];
