import type { CardValue } from "@scrum-poker/types";

/**
 * The standard planning-poker deck, kept consistent with the `CardValue` union
 * in `@scrum-poker/types`. Used by DevEstimation's voting grid so the deck and
 * the domain type never drift. `?` = unsure, `☕` = break.
 */
export const CARD_DECK: readonly CardValue[] = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "20",
  "40",
  "100",
  "?",
  "☕",
];

/** Default card-back pattern id (matches the legacy `PokerCard` default). */
export const DEFAULT_PATTERN = "8126";

/** Selectable card-back patterns (assets live in the app's `public/patterns`). */
export const PATTERN_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "1267", label: "Pink · Yellow" },
  { value: "2109", label: "Red · Cream" },
  { value: "9248", label: "Blue · Cream" },
  { value: "10680", label: "B&W · Red" },
  { value: "18242", label: "Yellow · Cream" },
  { value: "8126", label: "Red · Blue" },
];

/** Public URL for a card-back pattern asset. */
export function patternUrl(pattern: string | undefined): string {
  return `/patterns/${pattern || DEFAULT_PATTERN}.png`;
}
