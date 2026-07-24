import type { CSSProperties } from "react";
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

/**
 * Card-back patterns.
 *
 * These are generated entirely in CSS (layered gradients — no image assets), so
 * they stay crisp at any size, add zero network requests, and can't 404. Each
 * pattern is a self-contained {@link CSSProperties} object applied to the card
 * back. `id`s are stable and persisted with the voter's identity, so keep them
 * unchanged; unknown/legacy ids fall back to {@link DEFAULT_PATTERN}.
 */
export interface CardBackPattern {
  /** Stable id persisted with the voter identity. */
  readonly id: string;
  /** Human label shown in the picker. */
  readonly label: string;
  /** Inline background style for the card back. */
  readonly style: CSSProperties;
}

/** Top-of-card light sheen shared by the line-based patterns, for depth. */
const SHEEN =
  "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 34%)";

export const CARD_BACK_PATTERNS: readonly CardBackPattern[] = [
  {
    id: "emerald",
    label: "Emerald Lattice",
    style: {
      backgroundColor: "#0a3d24",
      backgroundImage: [
        SHEEN,
        "repeating-linear-gradient(45deg, rgba(150,240,190,0.12) 0 1px, transparent 1px 13px)",
        "repeating-linear-gradient(-45deg, rgba(150,240,190,0.12) 0 1px, transparent 1px 13px)",
        "radial-gradient(125% 120% at 28% 18%, #1a7a49 0%, #0c4a2c 52%, #062616 100%)",
      ].join(", "),
    },
  },
  {
    id: "azure",
    label: "Azure Dots",
    style: {
      backgroundColor: "#0c1f4a",
      backgroundImage: [
        SHEEN,
        "radial-gradient(rgba(160,195,255,0.22) 1.5px, transparent 1.6px)",
        "radial-gradient(120% 120% at 70% 12%, #1b3a86 0%, #10275f 55%, #081633 100%)",
      ].join(", "),
      backgroundSize: "auto, 14px 14px, auto",
      backgroundPosition: "0 0, 0 0, center",
    },
  },
  {
    id: "crimson",
    label: "Crimson Twill",
    style: {
      backgroundColor: "#3a0f14",
      backgroundImage: [
        SHEEN,
        "repeating-linear-gradient(45deg, rgba(240,205,140,0.12) 0 1px, transparent 1px 22px)",
        "repeating-linear-gradient(45deg, rgba(255,190,160,0.10) 0 2px, rgba(0,0,0,0.10) 2px 6px)",
        "radial-gradient(120% 120% at 30% 18%, #8a2329 0%, #4d1217 55%, #2a0a0d 100%)",
      ].join(", "),
    },
  },
  {
    id: "graphite",
    label: "Graphite Grid",
    style: {
      backgroundColor: "#14171c",
      backgroundImage: [
        SHEEN,
        "repeating-linear-gradient(0deg, rgba(185,195,210,0.10) 0 1px, transparent 1px 16px)",
        "repeating-linear-gradient(90deg, rgba(185,195,210,0.10) 0 1px, transparent 1px 16px)",
        "radial-gradient(120% 120% at 50% 0%, #2a303a 0%, #171b21 55%, #0c0e12 100%)",
      ].join(", "),
    },
  },
  {
    id: "sunset",
    label: "Sunset Mesh",
    style: {
      backgroundColor: "#2a1030",
      backgroundImage: [
        "radial-gradient(60% 60% at 20% 22%, rgba(255,183,94,0.60), transparent 70%)",
        "radial-gradient(55% 55% at 82% 24%, rgba(255,109,132,0.55), transparent 70%)",
        "radial-gradient(75% 75% at 50% 92%, rgba(139,82,201,0.60), transparent 72%)",
        "linear-gradient(180deg, #3a1440 0%, #1c0a24 100%)",
      ].join(", "),
    },
  },
  {
    id: "violet",
    label: "Violet Weave",
    style: {
      backgroundColor: "#1b1440",
      backgroundImage: [
        SHEEN,
        "repeating-linear-gradient(45deg, rgba(205,185,255,0.12) 0 3px, transparent 3px 12px)",
        "repeating-linear-gradient(-45deg, rgba(128,96,224,0.16) 0 3px, transparent 3px 12px)",
        "radial-gradient(120% 120% at 30% 15%, #3d2e82 0%, #241b57 55%, #120d2e 100%)",
      ].join(", "),
    },
  },
];

/** Default card-back pattern id. */
export const DEFAULT_PATTERN = "emerald";

/** Picker options (id + label) derived from {@link CARD_BACK_PATTERNS}. */
export const PATTERN_OPTIONS: readonly { value: string; label: string }[] =
  CARD_BACK_PATTERNS.map((p) => ({ value: p.id, label: p.label }));

const PATTERN_BY_ID = new Map(CARD_BACK_PATTERNS.map((p) => [p.id, p]));

/** Resolve a (possibly legacy/unknown) pattern id to a known one. */
export function normalizePattern(pattern: string | undefined): string {
  return pattern && PATTERN_BY_ID.has(pattern) ? pattern : DEFAULT_PATTERN;
}

/** Inline background style for a card-back pattern id (falls back to default). */
export function cardBackStyle(pattern: string | undefined): CSSProperties {
  return (PATTERN_BY_ID.get(pattern ?? "") ?? PATTERN_BY_ID.get(DEFAULT_PATTERN)!)
    .style;
}
