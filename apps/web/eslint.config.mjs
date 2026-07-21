import base from "@scrum-poker/config/eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    // Next.js build artifacts and the framework-managed ambient types file.
    ignores: [".next/**", "next-env.d.ts"],
  },
  ...base,
];
