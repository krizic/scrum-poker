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
