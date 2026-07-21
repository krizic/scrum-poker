import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@scrum-poker/db";
import {
  createSession,
  deleteSession,
} from "@/lib/server/services/session";
import { castVote } from "@/lib/server/services/vote";
import type { UserInfo } from "@scrum-poker/types";

import {
  activateEstimationAction,
  createEstimationAction,
  deleteEstimationAction,
  getSessionAction,
  importEstimationsAction,
  updateEstimationAction,
} from "../app/(product-owner)/actions";

/**
 * PO-route integration test (issue #16). Exercises the Product-Owner Server
 * Actions end-to-end against a live Postgres, proving they drive the real
 * services and that the resulting session graph converges as `/dev` + the PO
 * stats would see it over SSE.
 *
 * Requires a migrated Postgres reachable via `DATABASE_URL`; skipped otherwise
 * (so the rest of the suite still runs everywhere).
 *
 * Flow proven:
 *   createEstimationAction ×3 → activateEstimationAction (exactly one active)
 *   → castVote → updateEstimationAction(isEnded) → getSessionAction reflects
 *   the revealed vote; and importEstimationsAction bulk-creates rows.
 */
const hasDb = Boolean(process.env.DATABASE_URL);

const createdSessionIds: string[] = [];

async function newSession(): Promise<string> {
  const session = await createSession({ name: "po-flow-test", pin: "1234" });
  createdSessionIds.push(session.id);
  return session.id;
}

afterAll(async () => {
  if (!hasDb) return;
  await Promise.all(createdSessionIds.map((id) => deleteSession(id)));
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)("PO actions — manage → activate → reveal flow", () => {
  it("creates, activates one, records a vote, then reveals it", async () => {
    const sessionId = await newSession();

    // 1. Create three estimations via the PO action.
    const a = await createEstimationAction(sessionId, { name: "A" });
    const b = await createEstimationAction(sessionId, {
      name: "B",
      description: "second story",
    });
    const c = await createEstimationAction(sessionId, { name: "C" });
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;

    // 2. Activate B → exactly one active estimation in the session.
    const activated = await activateEstimationAction(sessionId, b.data.id);
    expect(activated.ok).toBe(true);

    const afterActivate = await getSessionAction(sessionId);
    const active = afterActivate?.estimations?.filter((e) => e.isActive) ?? [];
    expect(active.map((e) => e.id)).toEqual([b.data.id]);

    // 3. A developer casts a vote on the active estimation (SSE write path).
    const voter: UserInfo = {
      id: "voter-1",
      username: "Ada",
      email: "ada@example.com",
      pattern: "default",
    };
    await castVote(b.data.id, voter, "5");

    // While the round is live, the value exists but isEnded is still false.
    const live = await getSessionAction(sessionId);
    const liveB = live?.estimations?.find((e) => e.id === b.data.id);
    expect(liveB?.isEnded).toBe(false);
    expect(liveB?.votes?.[0]?.value).toBe("5");

    // 4. PO ends/reveals the round via updateEstimationAction(isEnded).
    const revealed = await updateEstimationAction(b.data.id, { isEnded: true });
    expect(revealed.ok).toBe(true);

    // 5. getSession reflects the revealed vote (isEnded true, value intact).
    const final = await getSessionAction(sessionId);
    const finalB = final?.estimations?.find((e) => e.id === b.data.id);
    expect(finalB?.isEnded).toBe(true);
    expect(finalB?.votes).toHaveLength(1);
    expect(finalB?.votes?.[0]?.voterName).toBe("Ada");
    expect(finalB?.votes?.[0]?.value).toBe("5");
  });

  it("renames / edits an estimation via updateEstimationAction", async () => {
    const sessionId = await newSession();
    const created = await createEstimationAction(sessionId, { name: "Old" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateEstimationAction(created.data.id, {
      name: "New name",
      description: "edited",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.data.name).toBe("New name");
    expect(updated.data.description).toBe("edited");
  });

  it("deletes an estimation via deleteEstimationAction", async () => {
    const sessionId = await newSession();
    const created = await createEstimationAction(sessionId, { name: "temp" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const del = await deleteEstimationAction(created.data.id);
    expect(del.ok).toBe(true);

    const after = await getSessionAction(sessionId);
    expect(
      after?.estimations?.some((e) => e.id === created.data.id),
    ).toBe(false);
  });

  it("bulk-imports estimations from parsed CSV rows", async () => {
    const sessionId = await newSession();

    const result = await importEstimationsAction(sessionId, [
      { name: "PROJ-1", description: "First" },
      { name: "PROJ-2", description: "Second" },
      { name: "PROJ-3" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(3);

    const session = await getSessionAction(sessionId);
    const names = (session?.estimations ?? []).map((e) => e.name).sort();
    expect(names).toEqual(["PROJ-1", "PROJ-2", "PROJ-3"]);
  });
});
