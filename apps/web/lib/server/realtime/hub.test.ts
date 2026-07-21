/**
 * Unit tests for {@link RealtimeHub} using a fake pg client (no database).
 *
 * These exercise the parts that are pure in-process logic — fan-out, reference
 * counting (LISTEN on first / UNLISTEN on last subscriber), payload parsing, and
 * reconnect + re-LISTEN — without a live Postgres. The live path (real triggers
 * → real NOTIFY) is proven separately in `hub.db.test.ts` (Docker Postgres).
 */
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RealtimeHub } from "./hub";

/** Minimal stand-in for `pg`'s Client: records queries, can emit notifications. */
class FakeClient extends EventEmitter {
  queries: string[] = [];
  connected = false;
  connectShouldFail = false;

  async connect(): Promise<void> {
    if (this.connectShouldFail) throw new Error("connect failed");
    this.connected = true;
  }

  async query(sql: string): Promise<void> {
    this.queries.push(sql);
  }

  async end(): Promise<void> {
    this.connected = false;
  }

  /** Simulate an inbound NOTIFY from Postgres. */
  emitNotification(channel: string, payload: string): void {
    this.emit("notification", { channel, payload });
  }

  /** Simulate a dropped connection. */
  drop(): void {
    this.connected = false;
    this.emit("error", new Error("connection terminated"));
  }
}

const SESSION = "11111111-2222-3333-4444-555555555555";
const CHANNEL = `session_${SESSION}`;

/** Flush the microtask queue so fire-and-forget listen()/connect() settle. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("RealtimeHub", () => {
  let clients: FakeClient[];
  let hub: RealtimeHub;

  beforeEach(() => {
    clients = [];
    hub = new RealtimeHub(() => {
      const c = new FakeClient();
      clients.push(c);
      return c;
    });
  });

  afterEach(async () => {
    await hub.close();
  });

  const latest = (): FakeClient => {
    const c = clients.at(-1);
    if (!c) throw new Error("no client created yet");
    return c;
  };

  it("LISTENs with a quoted channel on the first subscriber", async () => {
    hub.subscribe(SESSION, () => {});
    await flush();

    expect(clients).toHaveLength(1);
    // UUID has dashes → identifier MUST be double-quoted.
    expect(latest().queries).toContain(`LISTEN "${CHANNEL}"`);
    expect(hub.subscriberCount(SESSION)).toBe(1);
  });

  it("does not open a second connection or re-LISTEN for a second subscriber", async () => {
    hub.subscribe(SESSION, () => {});
    await flush();
    hub.subscribe(SESSION, () => {});
    await flush();

    expect(clients).toHaveLength(1); // ONE shared connection.
    const listens = latest().queries.filter((q) => q.startsWith("LISTEN"));
    expect(listens).toHaveLength(1); // Only the first subscriber LISTENs.
    expect(hub.subscriberCount(SESSION)).toBe(2);
  });

  it("fans out a notification to every subscriber exactly once", async () => {
    const a = vi.fn();
    const b = vi.fn();
    hub.subscribe(SESSION, a);
    hub.subscribe(SESSION, b);
    await flush();

    latest().emitNotification(
      CHANNEL,
      JSON.stringify({
        type: "vote",
        op: "insert",
        sessionId: SESSION,
        estimationId: "est-1",
      }),
    );

    const expected = {
      type: "vote",
      op: "insert",
      sessionId: SESSION,
      estimationId: "est-1",
    };
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).toHaveBeenCalledWith(expected);
    expect(b).toHaveBeenCalledWith(expected);
  });

  it("UNLISTENs only when the last subscriber for a session leaves", async () => {
    const unsubA = hub.subscribe(SESSION, () => {});
    const unsubB = hub.subscribe(SESSION, () => {});
    await flush();

    unsubA();
    await flush();
    expect(latest().queries).not.toContain(`UNLISTEN "${CHANNEL}"`);
    expect(hub.subscriberCount(SESSION)).toBe(1);

    unsubB();
    await flush();
    expect(latest().queries).toContain(`UNLISTEN "${CHANNEL}"`);
    expect(hub.subscriberCount(SESSION)).toBe(0);
    expect(hub.activeSessionCount).toBe(0);
  });

  it("unsubscribe is idempotent", async () => {
    const unsub = hub.subscribe(SESSION, () => {});
    await flush();
    unsub();
    unsub(); // no throw, no double-remove side effects
    await flush();
    expect(hub.subscriberCount(SESSION)).toBe(0);
  });

  it("delivers only to subscribers of the matching session", async () => {
    const other = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const onSession = vi.fn();
    const onOther = vi.fn();
    hub.subscribe(SESSION, onSession);
    hub.subscribe(other, onOther);
    await flush();

    latest().emitNotification(
      CHANNEL,
      JSON.stringify({ type: "session", op: "update", sessionId: SESSION, estimationId: null }),
    );

    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onOther).not.toHaveBeenCalled();
  });

  it("ignores malformed JSON payloads without throwing", async () => {
    const sub = vi.fn();
    hub.subscribe(SESSION, sub);
    await flush();

    expect(() => latest().emitNotification(CHANNEL, "not json{")).not.toThrow();
    expect(sub).not.toHaveBeenCalled();
  });

  it("reconnects after a dropped connection and re-LISTENs active channels", async () => {
    vi.useFakeTimers();
    try {
      const sub = vi.fn();
      hub.subscribe(SESSION, sub);
      await flush();
      const first = latest();
      expect(first.queries).toContain(`LISTEN "${CHANNEL}"`);

      // Connection drops.
      first.drop();
      await flush();

      // Backoff (first attempt = 250ms) then reconnect.
      await vi.advanceTimersByTimeAsync(300);
      await flush();

      expect(clients).toHaveLength(2); // A fresh connection was opened.
      const second = latest();
      expect(second).not.toBe(first);
      expect(second.queries).toContain(`LISTEN "${CHANNEL}"`); // re-LISTENed.

      // Events on the new connection still fan out — no leaked/duplicate subs.
      second.emitNotification(
        CHANNEL,
        JSON.stringify({ type: "vote", op: "update", sessionId: SESSION, estimationId: "e" }),
      );
      expect(sub).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not deliver to a subscriber that unsubscribed before a notification", async () => {
    const a = vi.fn();
    const b = vi.fn();
    hub.subscribe(SESSION, a);
    const unsubB = hub.subscribe(SESSION, b);
    await flush();

    unsubB();
    await flush();

    latest().emitNotification(
      CHANNEL,
      JSON.stringify({ type: "vote", op: "insert", sessionId: SESSION, estimationId: "e" }),
    );

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
});
