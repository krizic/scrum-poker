// Shared Tailwind CSS preset for the scrum-poker monorepo.
// Consumed by workspace packages via `@scrum-poker/config/tailwind`.
//
// This is the SINGLE SOURCE OF TRUTH for design tokens (colors, spacing, radii,
// shadows, gradients, motion). apps/web, packages/ui and packages/components all
// reference these tokens through Tailwind utilities (e.g. `bg-surface`,
// `text-muted`, `rounded-card`, `shadow-elevated`) — never scattered hex/px.
//
// Legacy Semantic UI design cues folded in as tokens:
//   - green accent for the selected state (#01a131) -> `brand` / `success` scale
//   - soft card drop shadows -> `shadow-card` / `shadow-elevated`
//
// Tailwind v4 loads this via the `@config` directive (see apps/web globals.css).

/** @type {import("tailwindcss").Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        // Brand / primary — the legacy green accent, expanded into a usable scale.
        // DEFAULT (500) is the historic selected-state color #01a131.
        brand: {
          50: "#e9fbf0",
          100: "#c9f4d9",
          200: "#96e9b6",
          300: "#5cd98d",
          400: "#26c065",
          500: "#01a131",
          600: "#018a2b",
          700: "#046f26",
          800: "#085722",
          900: "#08481e",
          950: "#02280f",
          DEFAULT: "#01a131",
          foreground: "#ffffff",
        },
        // Success — semantic alias of the brand green, kept separate so intent is
        // explicit at call sites (e.g. confirmations, "voted" states).
        success: {
          50: "#e9fbf0",
          100: "#c9f4d9",
          200: "#96e9b6",
          300: "#5cd98d",
          400: "#26c065",
          500: "#01a131",
          600: "#018a2b",
          700: "#046f26",
          DEFAULT: "#01a131",
          foreground: "#ffffff",
        },
        // Danger — destructive/error states and validation.
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        // Surfaces — page/panel/card backgrounds, layered from base to overlay.
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f7f9f8",
          muted: "#eef2f0",
          raised: "#ffffff",
          sunken: "#f1f4f3",
          inverse: "#0e1512",
          overlay: "rgba(9, 20, 15, 0.55)",
        },
        // Foreground text tokens.
        content: {
          DEFAULT: "#0f1a15",
          subtle: "#3a4a42",
          inverse: "#f7f9f8",
        },
        // Muted — secondary text (`text-muted`) and low-emphasis fills.
        muted: {
          DEFAULT: "#64756c",
          foreground: "#8a9a90",
        },
        // Borders / hairlines.
        border: {
          DEFAULT: "#dde5e1",
          strong: "#c3cec8",
          focus: "#01a131",
        },
        // Focus ring color token.
        ring: {
          DEFAULT: "#01a131",
        },
      },
      borderRadius: {
        input: "0.5rem",
        button: "0.625rem",
        card: "0.875rem",
        modal: "1rem",
        pill: "9999px",
      },
      boxShadow: {
        // Soft resting card shadow (replaces legacy `0 0 1px 1px rgba(77,77,77,.3)`).
        card: "0 1px 2px rgba(14, 21, 18, 0.06), 0 2px 8px rgba(14, 21, 18, 0.06)",
        // Hover/active elevation (replaces legacy stronger card shadow).
        elevated:
          "0 2px 4px rgba(14, 21, 18, 0.08), 0 8px 24px rgba(14, 21, 18, 0.12)",
        // Modal / popover overlay elevation.
        overlay:
          "0 8px 16px rgba(14, 21, 18, 0.12), 0 24px 48px rgba(14, 21, 18, 0.22)",
        // Focus ring shadow (used where outline isn't ideal).
        focus: "0 0 0 3px rgba(1, 161, 49, 0.35)",
      },
      backgroundImage: {
        // Subtle brand gradient for hero/primary surfaces.
        "brand-gradient":
          "linear-gradient(135deg, #01a131 0%, #018a2b 55%, #046f26 100%)",
        "surface-gradient":
          "linear-gradient(180deg, #ffffff 0%, #f7f9f8 100%)",
      },
      spacing: {
        // App rhythm tokens layered on the default scale.
        card: "1.25rem",
        section: "2.5rem",
      },
      fontFamily: {
        // `display` reserved for the poker-card face (legacy used Cardo serif).
        display: ["Cardo", "ui-serif", "Georgia", "serif"],
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "content-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.2, 0, 0, 1) both",
        "overlay-in": "overlay-in 200ms cubic-bezier(0.2, 0, 0, 1) both",
        "content-in": "content-in 220ms cubic-bezier(0.2, 0, 0, 1) both",
        "toast-in": "toast-in 220ms cubic-bezier(0.2, 0, 0, 1) both",
        "spin-slow": "spin-slow 900ms linear infinite",
      },
    },
  },
  plugins: [],
};

export default preset;
