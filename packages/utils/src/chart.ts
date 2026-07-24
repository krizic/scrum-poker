import type { Vote } from "@scrum-poker/types";

/**
 * Framework-agnostic pie-chart data shaping, ported from the legacy
 * `EstimationChart` component (`src/components/estimation-chart`).
 *
 * This returns a plain data array only — no `@nivo/pie` or React imports — so
 * the eventual Next.js chart component (issue #13) can own the rendering while
 * reusing this transform.
 */

/** One slice of the estimation pie chart. Matches nivo's `{ id, label, value }`. */
export interface PieDatum {
  /** Stable slice id (the card value, or "no-vote"). */
  id: string;
  /** Human-readable label (same as `id`). */
  label: string;
  /** Number of voters who picked this value. */
  value: number;
}

/** Placeholder id used for voters present without a cast value. */
export const NO_VOTE_ID = "no-vote";

/**
 * Transform an estimation's votes into pie-chart slices: one slice per distinct
 * card value, with `value` counting how many voters picked it. Voters without a
 * value are grouped under {@link NO_VOTE_ID}. Insertion order follows first
 * appearance (nivo re-sorts via `sortByValue` at render time).
 */
export function toPieChartData(votes?: Vote[]): PieDatum[] {
  const byValue = new Map<string, PieDatum>();
  for (const vote of votes ?? []) {
    const key = vote.value ?? NO_VOTE_ID;
    const existing = byValue.get(key);
    if (existing) {
      existing.value += 1;
    } else {
      byValue.set(key, { id: key, label: key, value: 1 });
    }
  }
  return Array.from(byValue.values());
}

/** Row index used by the single-row stacked bar chart. */
export const STACKED_BAR_INDEX = "votes";

/** Shape consumed by the stacked horizontal bar chart. */
export interface StackedBarChartData {
  /** The distinct card values, ordered by descending count (the stack keys). */
  keys: string[];
  /**
   * A single indexed row: `{ [STACKED_BAR_INDEX]: label, [value]: count, … }`.
   * One entry per key holds that value's vote count, so nivo renders one full-
   * width bar split into a segment per distinct card value.
   */
  data: Array<Record<string, string | number>>;
  /** Total number of votes across all keys (0 when empty). */
  total: number;
}

/**
 * Transform an estimation's votes into a single-row stacked horizontal bar:
 * each distinct card value becomes a stack segment sized by its vote count.
 * Keys are ordered by descending count so the largest block leads. Returns an
 * empty `keys`/`data` (and `total: 0`) when there are no votes.
 */
export function toStackedBarChartData(votes?: Vote[]): StackedBarChartData {
  const slices = toPieChartData(votes).sort((a, b) => b.value - a.value);
  if (slices.length === 0) {
    return { keys: [], data: [], total: 0 };
  }
  const row: Record<string, string | number> = { [STACKED_BAR_INDEX]: "Votes" };
  let total = 0;
  for (const slice of slices) {
    row[slice.id] = slice.value;
    total += slice.value;
  }
  return { keys: slices.map((s) => s.id), data: [row], total };
}
