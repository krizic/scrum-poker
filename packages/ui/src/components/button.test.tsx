import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders its children as an accessible button", () => {
    render(<Button>Reveal votes</Button>);

    const button = screen.getByRole("button", { name: "Reveal votes" });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("fires onClick when activated", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Vote</Button>);

    await user.click(screen.getByRole("button", { name: "Vote" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and marked busy while loading, and swallows clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the requested variant/size utility classes", () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });
    // Token-driven classes from the danger variant + lg size.
    expect(button).toHaveClass("bg-danger");
    expect(button).toHaveClass("h-12");
  });
});
