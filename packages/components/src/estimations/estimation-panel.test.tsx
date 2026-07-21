import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EstimationPanel } from "./estimation-panel";
import type { Estimation, Vote } from "@scrum-poker/types";

function makeVote(overrides: Partial<Vote> = {}): Vote {
  return {
    id: "vote-1",
    estimationId: "est-1",
    voterId: "voter-1",
    voterName: "Ada",
    voterEmail: "ada@example.com",
    pattern: "emerald",
    value: "5",
    createdAt: new Date(),
    ...overrides,
  };
}

function makeEstimation(overrides: Partial<Estimation> = {}): Estimation {
  return {
    id: "est-1",
    sessionId: "sess-1",
    name: "Login page",
    isActive: false,
    isEnded: false,
    createdAt: new Date(),
    votes: [makeVote()],
    ...overrides,
  };
}

describe("EstimationPanel", () => {
  it("while voting is live (isActive, not ended): Stop enabled, cards hidden, no stats", () => {
    render(
      <EstimationPanel
        estimation={makeEstimation({ isActive: true, isEnded: false })}
      />,
    );

    expect(screen.getByText("Voting live")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /start/i })).toBeDisabled();
    // Hidden card shows the placeholder, not the real value.
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("once ended (isEnded): votes are revealed, Stop disabled, no live badge", () => {
    render(
      <EstimationPanel
        estimation={makeEstimation({ isActive: true, isEnded: true })}
      />,
    );

    expect(screen.queryByText("Voting live")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeDisabled();
    // Revealed: the real value is shown, no placeholder.
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("?")).not.toBeInTheDocument();
  });

  it("calls onStop when Stop is clicked during a live round", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const estimation = makeEstimation({ isActive: true, isEnded: false });
    render(<EstimationPanel estimation={estimation} onStop={onStop} />);

    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenCalledWith(estimation);
  });
});
