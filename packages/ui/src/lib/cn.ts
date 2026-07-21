import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge configured to recognize our custom `text-card-face` utility
 * (registered as `fontSize.card-face` in the shared preset) as a *font-size*
 * class. Without this, tailwind-merge classifies `text-card-face` as a color
 * and silently drops it whenever it appears alongside a color like
 * `text-content` — which is exactly how the oversized poker-card numeral was
 * being reset to the default 16px.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["card-face"] }],
    },
  },
});

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind utilities.
 *
 * @example cn("px-2", condition && "px-4") // -> "px-4"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
