import { afterEach, describe, expect, it, vi } from "vitest";

import * as ngrok from "./ngrok";
import { getPublicJoinUrl, getPublicJoinUrlMode } from "./public-join-url";

describe("getPublicJoinUrlMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to ngrok when PUBLIC_JOIN_URL_MODE is unset", () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "");
    expect(getPublicJoinUrlMode()).toBe("ngrok");
  });

  it("is local when PUBLIC_JOIN_URL_MODE=local (case-insensitive)", () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "Local");
    expect(getPublicJoinUrlMode()).toBe("local");
  });

  it("falls back to ngrok for unrecognized values", () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "something-else");
    expect(getPublicJoinUrlMode()).toBe("ngrok");
  });
});

describe("getPublicJoinUrl — local mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins PUBLIC_BASE_URL with the dev join path", async () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "local");
    vi.stubEnv("PUBLIC_BASE_URL", "https://poker.example.com");

    const result = await getPublicJoinUrl("session-1");

    expect(result).toEqual({
      ok: true,
      url: "https://poker.example.com/dev?session=session-1",
    });
  });

  it("reports an error when PUBLIC_BASE_URL is not set", async () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "local");
    vi.stubEnv("PUBLIC_BASE_URL", "");

    const result = await getPublicJoinUrl("session-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/PUBLIC_BASE_URL is not set/i);
    }
  });

  it("reports an error when PUBLIC_BASE_URL is not a valid URL", async () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "local");
    vi.stubEnv("PUBLIC_BASE_URL", "not-a-url");

    const result = await getPublicJoinUrl("session-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not a valid URL/i);
    }
  });
});

describe("getPublicJoinUrl — ngrok mode (default)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("delegates to getNgrokTunnelUrl and joins the dev path", async () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "ngrok");
    vi.spyOn(ngrok, "getNgrokTunnelUrl").mockResolvedValue({
      ok: true,
      publicUrl: "https://abc123.ngrok-free.app",
    });

    const result = await getPublicJoinUrl("session-1");

    expect(result).toEqual({
      ok: true,
      url: "https://abc123.ngrok-free.app/dev?session=session-1",
    });
  });

  it("propagates the error result when the ngrok tunnel isn't resolvable", async () => {
    vi.stubEnv("PUBLIC_JOIN_URL_MODE", "ngrok");
    vi.spyOn(ngrok, "getNgrokTunnelUrl").mockResolvedValue({
      ok: false,
      error: "Tunnel not ready yet — try again in a few seconds.",
    });

    const result = await getPublicJoinUrl("session-1");

    expect(result).toEqual({
      ok: false,
      error: "Tunnel not ready yet — try again in a few seconds.",
    });
  });
});
