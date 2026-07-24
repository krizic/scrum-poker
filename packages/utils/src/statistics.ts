import type { CardValue, Estimation, Vote } from "@scrum-poker/types";

/**
 * Vote statistics helpers, ported from the legacy `EstimationStatistics`
 * component (`src/components/est-statistics`). All functions are pure and
 * framework-agnostic; they operate on the normalized `Vote[]` shape from
 * `@scrum-poker/types`.
 *
 * Non-numeric cards (`?`, `☕`, custom labels) and votes without a value are
 * excluded from every numeric aggregate so averages never divide by zero.
 */

/** Tally of how many voters picked a given card value. */
export interface VoteTally {
  /** The raw card value (e.g. "5", "?", "☕"). */
  value: string;
  /** How many voters picked this value. */
  count: number;
}

/** Aggregated statistics for a single estimation round. */
export interface EstimationStatistics {
  /** Mean of the numeric votes, or `null` when there are none. */
  average: number | null;
  /** Lowest numeric vote, or `null` when there are none. */
  min: number | null;
  /** Highest numeric vote, or `null` when there are none. */
  max: number | null;
  /** How many voters cast a numeric vote. */
  numericCount: number;
  /** How many voters are present on the estimation (numeric or not). */
  totalVotes: number;
  /** Per-value tally across all cast votes, incl. non-numeric cards. */
  distribution: VoteTally[];
  /**
   * `true` when every cast vote shares the same value (and there is at least
   * one vote). Mirrors the "did the team agree?" question.
   */
  hasConsensus: boolean;
}

/**
 * Whether a card value participates in numeric aggregates. `?` / `☕` and any
 * other non-numeric label (or a missing value) return `false`.
 */
export function isNumericCard(value?: CardValue): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  return !Number.isNaN(Number.parseInt(value, 10));
}

/** The numeric values of the votes, with non-numeric / empty votes removed. */
export function numericVoteValues(votes?: Vote[]): number[] {
  return (votes ?? [])
    .filter((vote) => isNumericCard(vote.value))
    .map((vote) => Number.parseInt(vote.value as string, 10));
}

/**
 * Mean of the numeric votes, or `null` when there are no numeric votes
 * (guards against divide-by-zero).
 */
export function averageVote(votes?: Vote[]): number | null {
  const values = numericVoteValues(votes);
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

/** Min/max of the numeric votes, or `null` when there are none. */
export function voteMinMax(votes?: Vote[]): { min: number; max: number } | null {
  const values = numericVoteValues(votes);
  if (values.length === 0) {
    return null;
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Per-value tally across every cast vote (numeric and non-numeric). Votes
 * without a value are ignored. Insertion order follows first appearance.
 */
export function voteDistribution(votes?: Vote[]): VoteTally[] {
  const tally = new Map<string, number>();
  for (const vote of votes ?? []) {
    if (vote.value === undefined || vote.value === null) {
      continue;
    }
    tally.set(vote.value, (tally.get(vote.value) ?? 0) + 1);
  }
  return Array.from(tally, ([value, count]) => ({ value, count }));
}

/**
 * `true` when every cast vote shares the same value. Requires at least one
 * cast vote; returns `false` for an empty/no-vote estimation.
 */
export function hasConsensus(votes?: Vote[]): boolean {
  const distribution = voteDistribution(votes);
  return distribution.length === 1;
}

/** Compute the full statistics bundle for an estimation's votes. */
export function computeEstimationStatistics(
  estimation: Pick<Estimation, "votes">,
): EstimationStatistics {
  const votes = estimation.votes ?? [];
  const minMax = voteMinMax(votes);
  return {
    average: averageVote(votes),
    min: minMax?.min ?? null,
    max: minMax?.max ?? null,
    numericCount: numericVoteValues(votes).length,
    totalVotes: votes.length,
    distribution: voteDistribution(votes),
    hasConsensus: hasConsensus(votes),
  };
}
