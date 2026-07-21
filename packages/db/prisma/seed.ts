/**
 * Prisma seed for `@scrum-poker/db`. Wired via `prisma.config.ts`
 * (`migrations.seed = "tsx prisma/seed.ts"`); run with `pnpm db:seed`.
 *
 * Inserts a small, deterministic demo: one session with a PIN, one active
 * estimation, and a couple of votes. Idempotent-ish — it upserts the session by
 * a fixed id so re-running doesn't accumulate duplicate demo data.
 *
 * Requires a reachable database (`DATABASE_URL`) with migrations applied
 * (`pnpm db:deploy` or `pnpm db:migrate`).
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_SESSION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ESTIMATION_ID = "00000000-0000-4000-8000-000000000002";

async function main(): Promise<void> {
  // Reset the demo session (cascades to its estimations + votes) so the seed is
  // repeatable.
  await prisma.session.deleteMany({ where: { id: DEMO_SESSION_ID } });

  const session = await prisma.session.create({
    data: {
      id: DEMO_SESSION_ID,
      name: "Demo Session",
      pin: "1234",
      estimations: {
        create: {
          id: DEMO_ESTIMATION_ID,
          name: "Login page refactor",
          description: "Estimate the effort to refactor the login page.",
          isActive: true,
          isEnded: false,
          votes: {
            create: [
              {
                voterId: "voter-alice",
                voterName: "Alice",
                voterEmail: "alice@example.com",
                pattern: "fibonacci",
                value: "5",
              },
              {
                voterId: "voter-bob",
                voterName: "Bob",
                voterEmail: "bob@example.com",
                pattern: "fibonacci",
                value: "8",
              },
            ],
          },
        },
      },
    },
    include: { estimations: { include: { votes: true } } },
  });

  const estimation = session.estimations[0];
  console.log(
    `Seeded session "${session.name}" (${session.id}) with estimation "${estimation?.name}" and ${estimation?.votes.length ?? 0} votes.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
