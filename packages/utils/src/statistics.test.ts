import { describe, expect, it } from "vitest";
import type { Vote } from "@scrum-poker/types";
import {
  averageVote,
  computeEstimationStatistics,
  hasConsensus,
  isNumericCard,
  numericVoteValues,
  voteDistribution,
  voteMinMax,
} from "./statistics";

/** Build a minimal Vote fixture; only `value` matters for these helpers. */
function vote(value: Vote["value"], id = value ?? "none"): Vote {
  return {
    id: `vote-${id}`,
    estimationId: "est-1",
    voterId: `voter-${id}`,
    voterName: "Dev",
    voterEmail: "dev@example.com",
    pattern: "identicon",
    value,
    createdAt: new Date(0),
  };
}

describe("isNumericCard", () => {
  it("treats deck numbers as numeric and specials/empty as non-numeric", () => {
    expect(isNumericCard("5")).toBe(true);
    expect(isNumericCard("100")).toBe(true);
    expect(isNumericCard("?")).toBe(false);
    expect(isNumericCard("☕")).toBe(false);
    expect(isNumericCard(undefined)).toBe(false);
  });
});

describe("averageVote — happy path", () => {
  it("averages numeric votes and ignores non-numeric ones", () => {
    const votes = [vote("2"), vote("3"), vote("8"), vote("?"), vote("☕")];
    expect(numericVoteValues(votes)).toEqual([2, 3, 8]);
    expect(averageVote(votes)).toBeCloseTo(13 / 3, 10);
    expect(voteMinMax(votes)).toEqual({ min: 2, max: 8 });
  });
});

describe("averageVote — edge cases (no divide-by-zero)", () => {
  it("returns null for all-non-numeric votes", () => {
    const votes = [vote("?"), vote("☕"), vote(undefined, "empty")];
    expect(averageVote(votes)).toBeNull();
    expect(voteMinMax(votes)).toBeNull();
    expect(numericVoteValues(votes)).toEqual([]);
  });

  it("returns null for empty / missing votes", () => {
    expect(averageVote([])).toBeNull();
    expect(averageVote(undefined)).toBeNull();
    expect(voteMinMax(undefined)).toBeNull();
  });
});

describe("voteDistribution & consensus", () => {
  it("tallies every cast value (numeric and special)", () => {
    const votes = [vote("5", "a"), vote("5", "b"), vote("?", "c")];
    expect(voteDistribution(votes)).toEqual([
      { value: "5", count: 2 },
      { value: "?", count: 1 },
    ]);
  });

  it("detects consensus only when all cast votes match", () => {
    expect(hasConsensus([vote("5", "a"), vote("5", "b")])).toBe(true);
    expect(hasConsensus([vote("5", "a"), vote("8", "b")])).toBe(false);
    expect(hasConsensus([])).toBe(false);
  });

  it("ignores voters without a value in the distribution", () => {
    const votes = [vote("3", "a"), vote(undefined, "b")];
    expect(voteDistribution(votes)).toEqual([{ value: "3", count: 1 }]);
  });
});

describe("computeEstimationStatistics", () => {
  it("bundles all metrics for a mixed estimation", () => {
    const votes = [vote("2"), vote("8"), vote("?"), vote(undefined, "x")];
    expect(computeEstimationStatistics({ votes })).toEqual({
      average: 5,
      min: 2,
      max: 8,
      numericCount: 2,
      totalVotes: 4,
      distribution: [
        { value: "2", count: 1 },
        { value: "8", count: 1 },
        { value: "?", count: 1 },
      ],
      hasConsensus: false,
    });
  });

  it("stays safe with no votes", () => {
    expect(computeEstimationStatistics({})).toEqual({
      average: null,
      min: null,
      max: null,
      numericCount: 0,
      totalVotes: 0,
      distribution: [],
      hasConsensus: false,
    });
  });
});
