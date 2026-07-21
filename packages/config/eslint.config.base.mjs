// Shared ESLint flat config for the scrum-poker monorepo.
// Consumed by workspace packages via `@scrum-poker/config/eslint`.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/.turbo/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
