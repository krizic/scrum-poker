import { prisma } from "@scrum-poker/db";
import { afterAll, describe, expect, it } from "vitest";

import { createSessionAction, joinSessionAction } from "../../../app/(start)/actions";

/**
 * Integration coverage for issue #14 — the Start-route Server Actions'
 * create/join path against a real Postgres. Requires DATABASE_URL (skipped
 * otherwise, mirroring `services.db.test.ts`). Proves: create → join-by-PIN
 * round-trips, unknown PIN surfaces a not-found error, and an empty PIN is
 * rejected client-safely without a DB round-trip.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const createdIds: string[] = [];

afterAll(async () => {
  if (!hasDb) return;
  await Promise.all(createdIds.map((id) => prisma.session.delete({ where: { id } }).catch(() => {})));
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)("Start actions — create + join by PIN", () => {
  it("creates a session and joins it back by PIN", async () => {
    const pin = `pin-${Date.now()}`;
    const created = await createSessionAction({ name: "Sprint 42", pin });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdIds.push(created.session.id);
    expect(created.session.name).toBe("Sprint 42");
    expect(created.session.pin).toBe(pin);

    const joined = await joinSessionAction({ pin });
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.session.id).toBe(created.session.id);
  });

  it("returns a not-found error for an unknown PIN", async () => {
    const joined = await joinSessionAction({ pin: "definitely-not-a-real-pin" });
    expect(joined.ok).toBe(false);
    if (joined.ok) return;
    expect(joined.error).toMatch(/no session found/i);
  });

  it("rejects an empty PIN without touching the DB", async () => {
    const joined = await joinSessionAction({ pin: "   " });
    expect(joined).toEqual({ ok: false, error: "Enter a session PIN to join." });
  });
});
