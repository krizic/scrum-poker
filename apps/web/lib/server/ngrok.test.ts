import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicJoinUrl, parseNgrokTunnels } from "./ngrok";

describe("parseNgrokTunnels — pure JSON parsing", () => {
  it("picks the https tunnel's public_url", () => {
    const body = {
      tunnels: [
        { proto: "http", public_url: "http://abc123.ngrok-free.app" },
        { proto: "https", public_url: "https://abc123.ngrok-free.app" },
      ],
    };
    expect(parseNgrokTunnels(body)).toEqual({
      ok: true,
      publicUrl: "https://abc123.ngrok-free.app",
    });
  });

  it("reports not-ready when there is no https tunnel yet", () => {
    const result = parseNgrokTunnels({ tunnels: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not ready/i);
    }
  });

  it("reports not-ready when the body is malformed", () => {
    const result = parseNgrokTunnels({ unexpected: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not ready/i);
    }
  });
});

describe("getPublicJoinUrl — fetches the ngrok API and builds the join link", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the joined dev URL when the tunnel is up", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tunnels: [{ proto: "https", public_url: "https://abc123.ngrok-free.app" }],
        }),
      }),
    );

    const result = await getPublicJoinUrl("session-1");

    expect(result).toEqual({
      ok: true,
      url: "https://abc123.ngrok-free.app/dev?session=session-1",
    });
  });

  it("reports unreachable when the ngrok API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await getPublicJoinUrl("session-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unavailable/i);
    }
  });

  it("reports unreachable when the ngrok API responds with a non-2xx status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    const result = await getPublicJoinUrl("session-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unavailable/i);
    }
  });
});
