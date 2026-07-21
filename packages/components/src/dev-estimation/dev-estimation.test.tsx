import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DevEstimation } from "./dev-estimation";
import type { Estimation, UserInfo } from "@scrum-poker/types";

const userInfo: UserInfo = {
  id: "voter-1",
  username: "Ada",
  email: "ada@example.com",
  pattern: "emerald",
};

function makeEstimation(overrides: Partial<Estimation> = {}): Estimation {
  return {
    id: "est-1",
    sessionId: "sess-1",
    name: "Login page",
    isActive: true,
    isEnded: false,
    createdAt: new Date(),
    votes: [],
    ...overrides,
  };
}

describe("DevEstimation", () => {
  it("lets the developer pick a card while voting is live", async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();
    render(
      <DevEstimation
        estimation={makeEstimation({ isActive: true, isEnded: false })}
        userInfo={userInfo}
        onVote={onVote}
      />,
    );

    await user.click(screen.getByRole("button", { name: /vote 5/i }));
    expect(onVote).toHaveBeenCalledWith("5");
  });

  it("locks the deck once the round is ended (isEnded): cards are not interactive", () => {
    const onVote = vi.fn();
    render(
      <DevEstimation
        estimation={makeEstimation({ isActive: true, isEnded: true })}
        userInfo={userInfo}
        onVote={onVote}
      />,
    );

    // No vote buttons are rendered when voting is closed.
    expect(
      screen.queryByRole("button", { name: /vote 5/i }),
    ).not.toBeInTheDocument();
    // A closed-voting notice is shown instead of the "pick ?" hint.
    expect(screen.getByText(/voting closed/i)).toBeInTheDocument();
    expect(onVote).not.toHaveBeenCalled();
  });
});
