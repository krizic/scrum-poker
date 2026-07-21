/**
 * Small display-formatting helpers. Kept minimal (YAGNI) — these back the
 * labels the legacy `EstimationStatistics` rendered ("n/a" fallbacks, fixed
 * decimals) while staying framework-agnostic.
 */

/** Format an average vote for display: `"n/a"` when null, else 2 decimals. */
export function formatAverage(average: number | null): string {
  return average === null ? "n/a" : average.toFixed(2);
}

/** Format a min/max pair for display: `"n/a"` when null, else `"min - max"`. */
export function formatMinMax(minMax: { min: number; max: number } | null): string {
  return minMax === null ? "n/a" : `${minMax.min} - ${minMax.max}`;
}

/** Format a "voted / total" ratio, mirroring the legacy "Voted" statistic. */
export function formatVotedRatio(voted: number, total: number): string {
  return `${voted} / ${total}`;
}
