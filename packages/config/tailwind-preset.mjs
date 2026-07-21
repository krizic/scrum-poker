// Shared Tailwind CSS preset for the scrum-poker monorepo.
// Consumed by workspace packages via `@scrum-poker/config/tailwind`.
// Centralized theme tokens (colors, spacing, radii, shadows, motion) live here so
// apps/web, packages/ui and packages/components stay visually consistent.
//
// NOTE: intentionally minimal for issue #5 — this only proves the preset is
// exportable/consumable via `workspace:*`. Real design tokens land with packages/ui.

/** @type {import("tailwindcss").Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        // Placeholder brand token namespace; real tokens added in packages/ui.
        brand: {
          DEFAULT: "#6d28d9",
        },
      },
    },
  },
  plugins: [],
};

export default preset;
