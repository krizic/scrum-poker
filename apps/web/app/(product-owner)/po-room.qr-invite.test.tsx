import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Session } from "@scrum-poker/types";
import { getPublicJoinUrlAction } from "./actions";
import { QrInviteButton } from "./po-room";

// jsdom has no ResizeObserver; Radix's Dialog doesn't strictly need it, but
// stub it defensively since some Radix internals probe for it.
if (typeof window.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
}

vi.mock("./actions", () => ({
  getPublicJoinUrlAction: vi.fn(),
}));

const session: Session = {
  id: "session-1",
  name: "Sprint 42 planning",
  createdAt: new Date(),
  lastUpdated: new Date(),
};

describe("QrInviteButton", () => {
  beforeEach(() => {
    vi.mocked(getPublicJoinUrlAction).mockReset();
  });

  it("renders the QR code and URL once the public link resolves", async () => {
    vi.mocked(getPublicJoinUrlAction).mockResolvedValue({
      ok: true,
      url: "https://abc123.ngrok-free.app/dev?session=session-1",
    });
    const user = userEvent.setup();

    render(<QrInviteButton session={session} />);
    await user.click(screen.getByRole("button", { name: /public qr invite/i }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue(
          "https://abc123.ngrok-free.app/dev?session=session-1",
        ),
      ).toBeInTheDocument(),
    );
    expect(getPublicJoinUrlAction).toHaveBeenCalledWith("session-1");
  });

  it("shows an error with a working retry when the public link can't be resolved", async () => {
    vi.mocked(getPublicJoinUrlAction).mockResolvedValueOnce({
      ok: false,
      error: "Public link unavailable — is the app running via docker compose?",
    });
    const user = userEvent.setup();

    render(<QrInviteButton session={session} />);
    await user.click(screen.getByRole("button", { name: /public qr invite/i }));

    await waitFor(() =>
      expect(screen.getByText(/public link unavailable/i)).toBeInTheDocument(),
    );

    vi.mocked(getPublicJoinUrlAction).mockResolvedValueOnce({
      ok: true,
      url: "https://xyz789.ngrok-free.app/dev?session=session-1",
    });
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue(
          "https://xyz789.ngrok-free.app/dev?session=session-1",
        ),
      ).toBeInTheDocument(),
    );
  });
});
