import { prisma } from "@scrum-poker/db";
import { afterAll, describe, expect, it } from "vitest";

import {
  activateEstimation,
  createEstimation,
  updateEstimation,
} from "./estimation";
import { createSession, deleteSession, getSession } from "./session";
import { castVote, VOTING_CLOSED_ERROR } from "./vote";
import type { UserInfo } from "@scrum-poker/types";

/**
 * DB-backed integration test for the Developer route (`/dev`, issue #15) vote
 * path. It exercises the exact services the `castVoteAction` / `getSessionAction`
 * Server Actions delegate to, proving the loop the route relies on:
 *
 *   castVote(estimationId, userInfo, value)  →  getSession(id) reflects the vote
 *
 * This is the server-side truth behind the SSE-driven "event → revalidate →
 * render" cycle: a developer's card click writes a vote, and the subsequent
 * session re-fetch (which every participant performs on the `pg_notify` change
 * event) shows that vote on the active estimation.
 *
 * Requires a live Postgres via `DATABASE_URL` (schema migrated). Skipped when
 * unset, like the sibling `services.db.test.ts` suite.
 */
const hasDb = Boolean(process.env.DATABASE_URL);

const createdSessionIds: string[] = [];

const developer: UserInfo = {
  id: "dev-15-voter",
  username: "Ada",
  email: "ada@example.com",
  pattern: "default",
};

afterAll(async () => {
  if (!hasDb) return;
  await Promise.all(createdSessionIds.map((id) => deleteSession(id)));
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)("/dev vote path — castVote → getSession", () => {
  it("reflects the developer's vote on the active estimation, and re-votes in place", async () => {
    // Arrange: a session with an active estimation (as the PO would set up).
    const session = await createSession({ name: "dev-vote-test" });
    createdSessionIds.push(session.id);
    const story = await createEstimation(session.id, { name: "Story A" });
    await activateEstimation(session.id, story.id);

    // Act 1: developer casts a "5".
    await castVote(story.id, developer, "5");

    // Assert 1: getSession reflects it on the active estimation.
    const afterFirst = await getSession(session.id);
    const active1 = afterFirst?.estimations?.find((e) => e.isActive);
    expect(active1?.id).toBe(story.id);
    const vote1 = active1?.votes?.find((v) => v.voterId === developer.id);
    expect(vote1?.value).toBe("5");

    // Act 2: developer changes the vote to "8".
    await castVote(story.id, developer, "8");

    // Assert 2: value updated in place — no duplicate row for this voter.
    const afterSecond = await getSession(session.id);
    const active2 = afterSecond?.estimations?.find((e) => e.isActive);
    const votesForVoter = (active2?.votes ?? []).filter(
      (v) => v.voterId === developer.id,
    );
    expect(votesForVoter).toHaveLength(1);
    expect(votesForVoter[0]?.value).toBe("8");
  });

  it("registers presence (value-less vote) without clearing an existing value", async () => {
    const session = await createSession({ name: "dev-presence-test" });
    createdSessionIds.push(session.id);
    const story = await createEstimation(session.id, { name: "Story B" });
    await activateEstimation(session.id, story.id);

    // A value-less castVote registers presence (voter appears, no value yet).
    await castVote(story.id, developer);
    const afterPresence = await getSession(session.id);
    const present = afterPresence?.estimations
      ?.find((e) => e.isActive)
      ?.votes?.find((v) => v.voterId === developer.id);
    expect(present).toBeDefined();
    expect(present?.value ?? null).toBeNull();

    // Then a real vote sets the value…
    await castVote(story.id, developer, "13");
    // …and a subsequent presence ping must NOT clear it.
    await castVote(story.id, developer);
    const afterPing = await getSession(session.id);
    const kept = afterPing?.estimations
      ?.find((e) => e.isActive)
      ?.votes?.find((v) => v.voterId === developer.id);
    expect(kept?.value).toBe("13");
  });

  it("rejects a vote once the round is ended (isEnded), leaving the value unchanged", async () => {
    const session = await createSession({ name: "dev-ended-test" });
    createdSessionIds.push(session.id);
    const story = await createEstimation(session.id, { name: "Story C" });
    await activateEstimation(session.id, story.id);

    // Developer votes "5" while the round is live.
    await castVote(story.id, developer, "5");

    // PO ends/reveals the round (as the Stop button does).
    await updateEstimation(story.id, { isEnded: true });

    // A further vote attempt must be rejected…
    await expect(castVote(story.id, developer, "8")).rejects.toThrow(
      VOTING_CLOSED_ERROR,
    );

    // …and the stored value must remain the pre-reveal "5".
    const after = await getSession(session.id);
    const kept = after?.estimations
      ?.find((e) => e.id === story.id)
      ?.votes?.find((v) => v.voterId === developer.id);
    expect(kept?.value).toBe("5");
  });
});
