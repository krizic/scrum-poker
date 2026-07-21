// Tailwind CSS v4 uses CSS-first configuration, but a legacy JS config is still
// supported via the `@config` directive (see app/globals.css). We use it here
// only to pull in the shared preset from @scrum-poker/config so all packages
// (apps/web, packages/ui, packages/components) share one set of theme tokens.
//
// Do NOT redefine tokens here — extend/override belongs in the shared preset.
import preset from "@scrum-poker/config/tailwind";

/** @type {import("tailwindcss").Config} */
export default {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    // Workspace UI sources — their Tailwind classes must be scanned so the
    // primitives compile when consumed here.
    "../../packages/ui/src/**/*.{ts,tsx}",
    // Future:
    // "../../packages/components/src/**/*.{ts,tsx}",
  ],
};
