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

  it("renders the back as a CSS pattern (no <img>) that changes with the pattern id", () => {
    const { container: emeraldC } = render(
      <PokerCard side="back" voterPattern="emerald" />,
    );
    // No broken image asset on the back anymore.
    expect(emeraldC.querySelector("img")).not.toBeInTheDocument();
    const emeraldLayer = emeraldC.querySelector<HTMLElement>("[style]");
    expect(emeraldLayer?.style.backgroundImage).toContain("#062616");

    const { container: azureC } = render(
      <PokerCard side="back" voterPattern="azure" />,
    );
    const azureLayer = azureC.querySelector<HTMLElement>("[style]");
    // Different choice → visibly different background.
    expect(azureLayer?.style.backgroundImage).not.toEqual(
      emeraldLayer?.style.backgroundImage,
    );
  });

  it("falls back to the default pattern for an unknown/legacy id", () => {
    const { container: legacyC } = render(
      <PokerCard side="back" voterPattern="8126" />,
    );
    const { container: defaultC } = render(<PokerCard side="back" />);
    const legacy = legacyC.querySelector<HTMLElement>("[style]");
    const dflt = defaultC.querySelector<HTMLElement>("[style]");
    expect(legacy?.style.backgroundImage).toEqual(dflt?.style.backgroundImage);
  });
});
