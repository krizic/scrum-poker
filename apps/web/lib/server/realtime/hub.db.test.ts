/**
 * LIVE integration test for the realtime path (requires Postgres).
 *
 * Proves the full chain the design depends on:
 *   Prisma write → pg_notify trigger → per-process LISTEN hub → subscriber.
 *
 * Requires a Postgres reachable via `DATABASE_URL` with the migrations applied
 * (incl. the `pg_notify` triggers). Skipped entirely when `DATABASE_URL` is
 * unset, so unit tests still run everywhere. The CI/verification harness spins
 * an ephemeral `postgres:16-alpine` and runs `db:deploy` before this suite.
 *
 * Covered:
 *  (a) a `castVote` write is fanned out to a subscriber with the exact payload
 *      shape the trigger emits.
 *  (b) two subscribers on the same session each receive the event exactly once.
 *  (c) unsubscribing the last subscriber UNLISTENs (no further delivery).
 */
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@scrum-poker/db";
import type { SessionEvent } from "@scrum-poker/types";

import { RealtimeHub } from "./hub";
import { createSession, deleteSession } from "../services/session";
import { createEstimation, activateEstimation } from "../services/estimation";
import { castVote } from "../services/vote";

const hasDb = Boolean(process.env.DATABASE_URL);
const createdSessionIds: string[] = [];

async function newSession(): Promise<string> {
  const s = await createSession({ name: "realtime-test" });
  createdSessionIds.push(s.id);
  return s.id;
}

/** Give the async LISTEN a moment to land before we write. */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Collect events for a subscriber; `waitFor(pred)` resolves with the first
 * matching event or rejects on timeout.
 */
function collector() {
  const events: SessionEvent[] = [];
  const waiters: Array<{
    pred: (e: SessionEvent) => boolean;
    resolve: (e: SessionEvent) => void;
  }> = [];
  const handler = (e: SessionEvent) => {
    events.push(e);
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w && w.pred(e)) {
        w.resolve(e);
        waiters.splice(i, 1);
      }
    }
  };
  const waitFor = (pred: (e: SessionEvent) => boolean, ms = 5000) =>
    new Promise<SessionEvent>((resolve, reject) => {
      const existing = events.find(pred);
      if (existing) return resolve(existing);
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for event")),
        ms,
      );
      waiters.push({
        pred,
        resolve: (e) => {
          clearTimeout(timer);
          resolve(e);
        },
      });
    });
  return { events, handler, waitFor };
}

afterAll(async () => {
  if (!hasDb) return;
  await Promise.all(createdSessionIds.map((id) => deleteSession(id)));
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)("RealtimeHub — live pg_notify path", () => {
  it("fans out a castVote write to a subscriber with the correct payload", async () => {
    const hub = new RealtimeHub();
    try {
      const sessionId = await newSession();
      const est = await createEstimation(sessionId, { name: "story" });

      const c = collector();
      hub.subscribe(sessionId, c.handler);
      await delay(250); // let LISTEN establish

      await castVote(est.id, { id: "voter-1", username: "Ada" }, "5");

      const event = await c.waitFor((e) => e.type === "vote" && e.op === "insert");
      expect(event).toEqual({
        type: "vote",
        op: "insert",
        sessionId,
        estimationId: est.id,
      });
    } finally {
      await hub.close();
    }
  });

  it("delivers to two subscribers on the same session exactly once each", async () => {
    const hub = new RealtimeHub();
    try {
      const sessionId = await newSession();
      const est = await createEstimation(sessionId, { name: "story-2" });

      const c1 = collector();
      const c2 = collector();
      hub.subscribe(sessionId, c1.handler);
      hub.subscribe(sessionId, c2.handler);
      await delay(250);

      // activateEstimation performs an UPDATE → estimation event.
      await activateEstimation(sessionId, est.id);

      const pred = (e: SessionEvent) =>
        e.type === "estimation" && e.op === "update" && e.estimationId === est.id;
      await Promise.all([c1.waitFor(pred), c2.waitFor(pred)]);

      // Exactly one matching delivery per subscriber (fan-out, not duplication).
      expect(c1.events.filter(pred)).toHaveLength(1);
      expect(c2.events.filter(pred)).toHaveLength(1);
    } finally {
      await hub.close();
    }
  });

  it("stops delivering after the last subscriber unsubscribes (UNLISTEN)", async () => {
    const hub = new RealtimeHub();
    try {
      const sessionId = await newSession();
      const est = await createEstimation(sessionId, { name: "story-3" });

      const c = collector();
      const unsub = hub.subscribe(sessionId, c.handler);
      await delay(250);

      unsub();
      await delay(250); // let UNLISTEN land

      await castVote(est.id, { id: "voter-x" }, "8");
      await delay(400); // give any (unexpected) notification time to arrive

      expect(c.events).toHaveLength(0);
      expect(hub.subscriberCount(sessionId)).toBe(0);
    } finally {
      await hub.close();
    }
  });
});
