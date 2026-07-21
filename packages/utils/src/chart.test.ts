import { describe, expect, it } from "vitest";
import type { Vote } from "@scrum-poker/types";
import { NO_VOTE_ID, toPieChartData } from "./chart";

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

describe("toPieChartData", () => {
  it("counts votes per distinct value as { id, label, value } slices", () => {
    const votes = [vote("5", "a"), vote("5", "b"), vote("8", "c"), vote("?", "d")];
    expect(toPieChartData(votes)).toEqual([
      { id: "5", label: "5", value: 2 },
      { id: "8", label: "8", value: 1 },
      { id: "?", label: "?", value: 1 },
    ]);
  });

  it("groups voters without a value under NO_VOTE_ID", () => {
    const votes = [vote("3", "a"), vote(undefined, "b"), vote(undefined, "c")];
    expect(toPieChartData(votes)).toEqual([
      { id: "3", label: "3", value: 1 },
      { id: NO_VOTE_ID, label: NO_VOTE_ID, value: 2 },
    ]);
  });

  it("returns an empty array for no votes", () => {
    expect(toPieChartData([])).toEqual([]);
    expect(toPieChartData(undefined)).toEqual([]);
  });
});
