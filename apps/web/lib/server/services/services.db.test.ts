import { prisma } from "@scrum-poker/db";
import { afterAll, describe, expect, it } from "vitest";

import {
  activateEstimation,
  createEstimation,
} from "./estimation";
import {
  createSession,
  deleteSession,
} from "./session";
import { castVote } from "./vote";

/**
 * DB-backed invariant tests. These require a live Postgres reachable via
 * `DATABASE_URL` (with the schema migrated). When it is unset the whole suite is
 * skipped — the pure mapping tests in `user-info.test.ts` still run everywhere.
 *
 * Covered invariants (the two most regression-prone, per the design spec):
 *  (a) `activateEstimation` makes exactly one estimation active and deactivates
 *      the rest — including concurrent activations converging to one active.
 *  (b) `castVote` upserts on `(estimationId, voterId)`: a second vote by the same
 *      voter updates in place (no duplicate row) and can change the value.
 */
const hasDb = Boolean(process.env.DATABASE_URL);

const createdSessionIds: string[] = [];

async function newSession(): Promise<string> {
  const session = await createSession({ name: "invariant-test" });
  createdSessionIds.push(session.id);
  return session.id;
}

afterAll(async () => {
  if (!hasDb) return;
  // Cascades to estimations + votes.
  await Promise.all(createdSessionIds.map((id) => deleteSession(id)));
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)("activateEstimation — single-active invariant", () => {
  it("activates exactly one and deactivates all others in the session", async () => {
    const sessionId = await newSession();
    const a = await createEstimation(sessionId, { name: "A" });
    const b = await createEstimation(sessionId, { name: "B" });
    const c = await createEstimation(sessionId, { name: "C" });

    const activatedB = await activateEstimation(sessionId, b.id);
    expect(activatedB.isActive).toBe(true);

    const rows = await prisma.estimation.findMany({ where: { sessionId } });
    const active = rows.filter((r) => r.isActive).map((r) => r.id);
    expect(active).toEqual([b.id]);
    expect(rows.find((r) => r.id === a.id)?.isActive).toBe(false);
    expect(rows.find((r) => r.id === c.id)?.isActive).toBe(false);

    // Re-activating a different estimation flips the single active over.
    await activateEstimation(sessionId, c.id);
    const rows2 = await prisma.estimation.findMany({ where: { sessionId } });
    expect(rows2.filter((r) => r.isActive).map((r) => r.id)).toEqual([c.id]);
  });

  it("concurrent activations of different estimations converge to exactly one active", async () => {
    const sessionId = await newSession();
    const a = await createEstimation(sessionId, { name: "A" });
    const b = await createEstimation(sessionId, { name: "B" });
    const c = await createEstimation(sessionId, { name: "C" });

    await Promise.all([
      activateEstimation(sessionId, a.id),
      activateEstimation(sessionId, b.id),
      activateEstimation(sessionId, c.id),
    ]);

    const rows = await prisma.estimation.findMany({ where: { sessionId } });
    expect(rows.filter((r) => r.isActive)).toHaveLength(1);
  });

  it("throws when the estimation is not part of the session", async () => {
    const sessionId = await newSession();
    const otherSessionId = await newSession();
    const foreign = await createEstimation(otherSessionId, { name: "foreign" });

    await expect(
      activateEstimation(sessionId, foreign.id),
    ).rejects.toThrow(/not found/);
  });
});

describe.skipIf(!hasDb)("castVote — upsert on (estimationId, voterId)", () => {
  it("a second vote by the same voter updates in place (no duplicate row)", async () => {
    const sessionId = await newSession();
    const estimation = await createEstimation(sessionId, { name: "story" });
    const userInfo = {
      id: "voter-1",
      username: "Ada",
      email: "ada@example.com",
      pattern: "retro",
    };

    const first = await castVote(estimation.id, userInfo, "3");
    expect(first.value).toBe("3");

    const second = await castVote(estimation.id, userInfo, "8");
    expect(second.value).toBe("8");
    // Same row updated, not a new one.
    expect(second.id).toBe(first.id);

    const votes = await prisma.vote.findMany({
      where: { estimationId: estimation.id },
    });
    expect(votes).toHaveLength(1);
    expect(votes[0]?.value).toBe("8");
  });

  it("registering presence (no value) does not clear an existing vote value", async () => {
    const sessionId = await newSession();
    const estimation = await createEstimation(sessionId, { name: "story" });
    const userInfo = { id: "voter-2", username: "Lin" };

    await castVote(estimation.id, userInfo, "5");
    const presence = await castVote(estimation.id, userInfo); // no value
    expect(presence.value).toBe("5");

    const votes = await prisma.vote.findMany({
      where: { estimationId: estimation.id },
    });
    expect(votes).toHaveLength(1);
    expect(votes[0]?.value).toBe("5");
  });

  it("registers presence with no value for a brand-new voter", async () => {
    const sessionId = await newSession();
    const estimation = await createEstimation(sessionId, { name: "story" });

    const presence = await castVote(estimation.id, { id: "voter-3" });
    expect(presence.value).toBeUndefined();

    const votes = await prisma.vote.findMany({
      where: { estimationId: estimation.id },
    });
    expect(votes).toHaveLength(1);
  });
});
