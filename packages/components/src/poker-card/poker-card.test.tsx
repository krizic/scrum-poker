import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PokerCard } from "./poker-card";

describe("PokerCard", () => {
  it("renders the value on the front face", () => {
    render(<PokerCard side="front" voteValue="8" />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("is presentational (not a button) when no onSelect is provided", () => {
    render(<PokerCard side="front" voteValue="5" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("becomes an accessible button and reports its value on select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PokerCard side="front" voteValue="13" onSelect={onSelect} />);

    const card = screen.getByRole("button", { name: "Vote 13" });
    expect(card).toBeInTheDocument();

    await user.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("13");
  });

  it("reflects selection state via aria-pressed", () => {
    const onSelect = vi.fn();
    render(
      <PokerCard side="front" voteValue="3" selected onSelect={onSelect} />,
    );
    expect(screen.getByRole("button", { name: "Vote 3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a submitting spinner instead of the value when loading", () => {
    render(<PokerCard side="front" voteValue="20" isLoading />);
    expect(screen.queryByText("20")).not.toBeInTheDocument();
    expect(screen.getByText("Submitting vote…")).toBeInTheDocument();
  });
});
