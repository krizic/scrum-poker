// Tailwind content wiring for @scrum-poker/components.
//
// Consumers (apps/web) should add this package's `src` glob to their own
// Tailwind `content` so the composed-component classes compile. This file also
// re-exports the shared preset so the package can be linted/previewed in
// isolation against the same centralized tokens.
import preset from "@scrum-poker/config/tailwind";

/** @type {import("tailwindcss").Config} */
export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    // Primitive classes composed here originate in @scrum-poker/ui.
    "../ui/src/**/*.{ts,tsx}",
  ],
};
