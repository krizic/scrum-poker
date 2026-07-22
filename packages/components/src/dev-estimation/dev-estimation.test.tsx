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

  it("hides the whole panel once the round is ended (isEnded)", () => {
    const onVote = vi.fn();
    const { container } = render(
      <DevEstimation
        estimation={makeEstimation({ isActive: true, isEnded: true })}
        userInfo={userInfo}
        onVote={onVote}
      />,
    );

    // The entire voting panel is hidden; developers read the outcome from the
    // separate "Results" roster the room renders below.
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/now estimating/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /vote 5/i }),
    ).not.toBeInTheDocument();
    expect(onVote).not.toHaveBeenCalled();
  });
});
