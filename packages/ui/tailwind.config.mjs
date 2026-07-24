// Tailwind content wiring for @scrum-poker/ui.
//
// Consumers (apps/web, packages/components) should add this package's `src` glob
// to their own Tailwind `content` so the primitive classes compile. This file
// also re-exports the shared preset so the UI package can be linted/previewed in
// isolation against the same centralized tokens.
import preset from "@scrum-poker/config/tailwind";

/** @type {import("tailwindcss").Config} */
export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
};
