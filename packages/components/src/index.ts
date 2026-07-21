/**
 * `@scrum-poker/components` — app-specific composed components for scrum-poker.
 *
 * Each component is built by composing `@scrum-poker/ui` primitives, styled
 * exclusively with Tailwind utilities that reference the centralized theme
 * tokens in `@scrum-poker/config`. All vote-math / CSV / formatting comes from
 * `@scrum-poker/utils`. Components are data-in / callbacks-out only — they never
 * touch the DB, services, or SSE (routes wire that in).
 */

export { PokerCard, type PokerCardProps } from "./poker-card/poker-card";
export { CardReveal, type CardRevealProps } from "./card-reveal/card-reveal";
export { VotesTable, type VotesTableProps } from "./votes-table/votes-table";
export {
  EstimationChart,
  type EstimationChartProps,
} from "./estimation-chart/estimation-chart";
export {
  EstStatistics,
  type EstStatisticsProps,
} from "./est-statistics/est-statistics";
export {
  Estimations,
  type EstimationsProps,
} from "./estimations/estimations";
export {
  EstimationPanel,
  type EstimationPanelProps,
} from "./estimations/estimation-panel";
export {
  DevEstimation,
  type DevEstimationProps,
} from "./dev-estimation/dev-estimation";
export { ImportZone, type ImportZoneProps } from "./import-zone/import-zone";
export { DevSignIn, type DevSignInProps } from "./dev-sign-in/dev-sign-in";

// Shared helpers / constants used by the components (handy for route wiring).
export { gravatarUrl, type GravatarOptions } from "./lib/gravatar";
export {
  CARD_DECK,
  DEFAULT_PATTERN,
  PATTERN_OPTIONS,
  patternUrl,
} from "./lib/deck";
