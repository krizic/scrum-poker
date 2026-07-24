# QR Public Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the PO open a QR code (in a header button/dialog on `/po`) that developers outside the local network can scan to join the session, via a temporary ngrok tunnel to the dockerized app.

**Architecture:** An always-on `ngrok` sidecar container tunnels `http://web:3000` to a public HTTPS URL. A pure resolver module (`apps/web/lib/server/ngrok.ts`) fetches ngrok's local API (`http://ngrok:4040/api/tunnels`) and builds the developer join link; a thin Server Action exposes it to a new `QrInviteButton` client component that renders it as a QR code (`react-qr-code`) in a `Dialog`.

**Tech Stack:** Next.js 16 App Router / React 19, `@scrum-poker/ui` (Radix Dialog), `react-qr-code`, Vitest + Testing Library, docker-compose, ngrok.

## Global Constraints

- Package manager is pnpm workspaces — scope commands with `pnpm --filter @scrum-poker/web <cmd>` from the repo root, or `cd apps/web` first.
- Never hardcode or commit real secrets (`NGROK_AUTHTOKEN` stays blank in `.env.example`; real value goes only in the user's local, gitignored `.env`).
- Follow existing file conventions exactly: Server Actions return `{ ok: true; data }` / `{ ok: false; error }`-shaped discriminated unions (see `apps/web/app/(product-owner)/actions.ts`); pure/testable logic lives outside `server-only`-guarded service files (see `apps/web/lib/server/services/user-info.ts`).
- Styling is Tailwind utility classes referencing the shared theme tokens only — no inline styles / new CSS files.
- Run `pnpm --filter @scrum-poker/web test` (or the two new test files directly) before every commit in this plan; run `pnpm --filter @scrum-poker/web typecheck` at the end.

---

### Task 1: Docker Compose — always-on ngrok sidecar + env vars

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

**Interfaces:**
- Produces: an `ngrok` compose service reachable from the `web` container at `http://ngrok:4040/api/tunnels` (consumed by Task 2's `getPublicJoinUrl`).
- Produces: `NGROK_AUTHTOKEN` and `NGROK_API_URL` env vars documented in `.env.example` (consumed by Task 2 and the README update in Task 5).

- [ ] **Step 1: Add the `ngrok` service to `docker-compose.yml`**

Add a new service after `web`, before the top-level `volumes:` key:

```yaml
  ngrok:
    image: ngrok/ngrok:latest
    restart: unless-stopped
    command: ["http", "web:3000"]
    environment:
      NGROK_AUTHTOKEN: ${NGROK_AUTHTOKEN:?Set NGROK_AUTHTOKEN in .env to enable the public QR invite feature}
    depends_on:
      web:
        condition: service_healthy
```

Also update the file's top comment block to mention it, e.g. change:

```
# Brings up Postgres + the Next.js standalone server. On start, the web
```

to:

```
# Brings up Postgres + the Next.js standalone server + an ngrok sidecar (for
# the PO's "public QR invite" feature). On start, the web
```

- [ ] **Step 2: Document the new env vars in `.env.example`**

Append after the existing `NEXT_PUBLIC_SENTRY_DSN=` line:

```
# --- Public QR invite (ngrok sidecar; optional) ------------------------------
# Required for the PO's "Public QR invite" header button to work. Get a free
# token at https://dashboard.ngrok.com/get-started/your-authtoken and set it
# here (never commit a real token). Leave blank to skip the feature — the
# `ngrok` compose service will simply fail to start; `db`/`web` are unaffected.
NGROK_AUTHTOKEN=
# Override only if the ngrok API is reachable at a different host/port (e.g.
# running the ngrok agent outside of docker-compose during local development).
NGROK_API_URL=http://ngrok:4040/api/tunnels
```

- [ ] **Step 3: Validate compose config parses**

Run: `docker compose config --quiet`
Expected: no output, exit code 0, when `NGROK_AUTHTOKEN` is unset this only warns about the `ngrok` service's required var — command still exits 0 for `config --quiet` (it doesn't evaluate `:?` failures, that only triggers on `up`/`run`). If your shell prints a warning about the unset variable, that's expected and fine.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add ngrok sidecar for public QR invite tunnel"
```

---

### Task 2: `ngrok.ts` resolver module + Server Action

**Files:**
- Create: `apps/web/lib/server/ngrok.ts`
- Create: `apps/web/lib/server/ngrok.test.ts`
- Modify: `apps/web/app/(product-owner)/actions.ts`

**Interfaces:**
- Consumes: `sessionHref` from `apps/web/lib/session-route.ts` — `sessionHref(role: "dev" | "po", sessionId: string): string` (existing, returns e.g. `"/dev?session=abc"`).
- Produces: `export type PublicJoinUrlResult = { ok: true; url: string } | { ok: false; error: string }`, `export function parseNgrokTunnels(body: unknown): { ok: true; publicUrl: string } | { ok: false; error: string }`, `export async function getPublicJoinUrl(sessionId: string): Promise<PublicJoinUrlResult>` — all consumed by Task 3's `QrInviteButton` (via the new `getPublicJoinUrlAction` Server Action).

- [ ] **Step 1: Write the failing tests**

Create `apps/web/lib/server/ngrok.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @scrum-poker/web test ngrok.test.ts`
Expected: FAIL — `Cannot find module './ngrok'` (or similar resolution error), since `ngrok.ts` doesn't exist yet.

- [ ] **Step 3: Write `apps/web/lib/server/ngrok.ts`**

```ts
/**
 * ngrok tunnel resolution for the PO's "Public QR invite" header button.
 *
 * Turns the ngrok sidecar's local API response (`docker-compose.yml`'s
 * `ngrok` service, `http://ngrok:4040/api/tunnels`) into a public
 * developer-join URL. `parseNgrokTunnels` is pure (no I/O) so it's unit-tested
 * directly; `getPublicJoinUrl` wraps it with the actual `fetch` call and the
 * `sessionHref` join-link contract from `lib/session-route.ts` (the same
 * target the existing "Copy invite link" button uses, just with a public host
 * instead of `window.location.origin`).
 */
import { sessionHref } from "@/lib/session-route";

export type PublicJoinUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

interface NgrokTunnel {
  proto?: unknown;
  public_url?: unknown;
}

const UNREACHABLE_ERROR =
  "Public link unavailable — is the app running via `docker compose` with the ngrok tunnel (NGROK_AUTHTOKEN set)?";
const NOT_READY_ERROR = "Tunnel not ready yet — try again in a few seconds.";

/**
 * Parse the ngrok `/api/tunnels` JSON body and pick the https tunnel's
 * `public_url`. Pure — no I/O — so it's directly unit-testable.
 */
export function parseNgrokTunnels(
  body: unknown,
): { ok: true; publicUrl: string } | { ok: false; error: string } {
  const tunnels =
    typeof body === "object" && body !== null
      ? (body as { tunnels?: unknown }).tunnels
      : undefined;

  if (!Array.isArray(tunnels)) {
    return { ok: false, error: NOT_READY_ERROR };
  }

  const httpsTunnel = (tunnels as NgrokTunnel[]).find(
    (tunnel) =>
      tunnel.proto === "https" &&
      typeof tunnel.public_url === "string" &&
      tunnel.public_url.length > 0,
  );

  if (!httpsTunnel) {
    return { ok: false, error: NOT_READY_ERROR };
  }

  return { ok: true, publicUrl: httpsTunnel.public_url as string };
}

/**
 * Resolve the public developer-join URL for `sessionId` via the ngrok
 * sidecar's local API. Returns a discriminated result instead of throwing so
 * the Server Action can hand it straight to the client for a toast/inline
 * error instead of a thrown-exception 500.
 */
export async function getPublicJoinUrl(sessionId: string): Promise<PublicJoinUrlResult> {
  const apiUrl = process.env.NGROK_API_URL || "http://ngrok:4040/api/tunnels";

  let body: unknown;
  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, error: UNREACHABLE_ERROR };
    }
    body = await res.json();
  } catch (err) {
    console.error("getPublicJoinUrl: ngrok API unreachable", { apiUrl }, err);
    return { ok: false, error: UNREACHABLE_ERROR };
  }

  const parsed = parseNgrokTunnels(body);
  if (!parsed.ok) {
    return parsed;
  }

  return { ok: true, url: `${parsed.publicUrl}${sessionHref("dev", sessionId)}` };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @scrum-poker/web test ngrok.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Add the Server Action wrapper**

In `apps/web/app/(product-owner)/actions.ts`, add the import alongside the existing service imports:

```ts
import {
  activateEstimation,
  createEstimation,
  deleteEstimation,
  getSession,
  importEstimations,
  updateEstimation,
  type CreateEstimationInput,
  type UpdateEstimationInput,
} from "@/lib/server/services";
import { getPublicJoinUrl, type PublicJoinUrlResult } from "@/lib/server/ngrok";
```

Then append this function at the end of the file (after `getSessionAction`):

```ts
/**
 * Resolve the public developer-join URL for the "Public QR invite" feature
 * (PO session header) — proxies to the ngrok sidecar's local API. See
 * `lib/server/ngrok.ts` for the resolution logic; this is a thin wrapper
 * matching the other Server Actions in this file.
 */
export async function getPublicJoinUrlAction(
  sessionId: string,
): Promise<PublicJoinUrlResult> {
  return getPublicJoinUrl(sessionId);
}
```

- [ ] **Step 6: Typecheck + run the full web test suite**

Run: `pnpm --filter @scrum-poker/web typecheck && pnpm --filter @scrum-poker/web test`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/server/ngrok.ts apps/web/lib/server/ngrok.test.ts apps/web/app/\(product-owner\)/actions.ts
git commit -m "feat: resolve public ngrok join URL via a Server Action"
```

---

### Task 3: Enable component tests for `apps/web` (jsdom + Testing Library)

**Files:**
- Modify: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `app/**/*.test.tsx` files now run under a `jsdom` environment with Testing Library's `jest-dom` matchers registered — consumed by Task 4's `po-room` component test. `lib/**/*.test.ts` and `test/**/*.test.ts` keep running under the default `node` environment (unaffected).

- [ ] **Step 1: Add the testing-library + jsdom devDependencies**

Run from repo root:

```bash
pnpm --filter @scrum-poker/web add -D jsdom@^25.0.1 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @testing-library/user-event@^14.5.2 @testing-library/dom@^10.4.0
```

Expected: `apps/web/package.json`'s `devDependencies` gains these 5 entries and the lockfile updates; command exits 0.

- [ ] **Step 2: Update `apps/web/vitest.config.ts`**

Replace the full file with:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for `@scrum-poker/web`.
 *
 * The service layer under `lib/server/services` imports `server-only` so it can
 * never leak into a client bundle. That package's `default` export intentionally
 * throws when imported outside a React Server Components graph, so under Vitest
 * (plain Node) we alias it to a harmless no-op stub. This lets the DB-invariant
 * and pure-mapping tests import the real service modules unchanged.
 *
 * `app/**\/*.test.tsx` component tests (e.g. `po-room`'s `QrInviteButton`) need a
 * browser-like DOM, so those files run under `jsdom` via `environmentMatchGlobs`
 * while everything else (the DB-touching `test/**` and pure `lib/**` tests)
 * keeps the default `node` environment. `@scrum-poker/config/vitest-setup`
 * registers the shared `@testing-library/jest-dom` matchers.
 */
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "test/**/*.test.ts", "app/**/*.test.tsx"],
    environment: "node",
    environmentMatchGlobs: [["app/**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["@scrum-poker/config/vitest-setup"],
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
      // Mirror the tsconfig `@/*` path alias so tests can import app code
      // (e.g. Server Actions under `app/`) the same way the app does.
      "@/": `${fileURLToPath(new URL(".", import.meta.url))}`,
    },
  },
});
```

- [ ] **Step 3: Verify the existing suite still passes**

Run: `pnpm --filter @scrum-poker/web test`
Expected: PASS — all previously-passing `lib/**` and `test/**` tests are unaffected (no `app/**/*.test.tsx` files exist yet, so `include` finding zero matches there is fine).

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts pnpm-lock.yaml
git commit -m "test: enable jsdom for apps/web component tests"
```

---

### Task 4: `QrInviteButton` component (PO session header)

**Files:**
- Modify: `apps/web/app/(product-owner)/po-room.tsx`
- Create: `apps/web/app/(product-owner)/po-room.qr-invite.test.tsx`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: `getPublicJoinUrlAction(sessionId: string): Promise<PublicJoinUrlResult>` from Task 2 (`./actions`); `Session` type from `@scrum-poker/types` (`{ id: string; name?: string; pin?: string; ... }`).
- Produces: `export function QrInviteButton({ session }: { session: Session }): JSX.Element`, rendered in the session header next to `CopyInviteButton`. Exported (unlike the module-private `CopyInviteButton`/`StreamStatus`) so it's directly unit-testable without mounting the full `PoFlow` + SSE stream.

- [ ] **Step 1: Add the `react-qr-code` dependency**

Run from repo root:

```bash
pnpm --filter @scrum-poker/web add react-qr-code
```

Expected: `apps/web/package.json`'s `dependencies` gains `react-qr-code`; command exits 0.

- [ ] **Step 2: Write the failing component test**

Create `apps/web/app/(product-owner)/po-room.qr-invite.test.tsx`:

```tsx
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QrInviteButton } from "./po-room";
import { getPublicJoinUrlAction } from "./actions";
import type { Session } from "@scrum-poker/types";

// jsdom has no ResizeObserver; Radix's Dialog doesn't strictly need it, but
// stub it defensively since some Radix internals probe for it.
if (typeof window.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error jsdom lacks ResizeObserver
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @scrum-poker/web test po-room.qr-invite.test.tsx`
Expected: FAIL — `QrInviteButton` is not exported from `./po-room` yet.

- [ ] **Step 4: Add the `QrCode` icon import**

In `apps/web/app/(product-owner)/po-room.tsx`, change:

```ts
import { Check, Copy, Pencil, Plus, Wifi, WifiOff } from "lucide-react";
```

to:

```ts
import {
  Check,
  Copy,
  Pencil,
  Plus,
  QrCode,
  TriangleAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
```

- [ ] **Step 5: Import `getPublicJoinUrlAction` and `QRCode`**

Change:

```ts
import {
  activateEstimationAction,
  createEstimationAction,
  deleteEstimationAction,
  getSessionAction,
  importEstimationsAction,
  updateEstimationAction,
} from "./actions";
```

to:

```ts
import {
  activateEstimationAction,
  createEstimationAction,
  deleteEstimationAction,
  getPublicJoinUrlAction,
  getSessionAction,
  importEstimationsAction,
  updateEstimationAction,
} from "./actions";
import QRCode from "react-qr-code";
```

- [ ] **Step 6: Add the `QrInviteButton` component**

Immediately after the closing brace of `CopyInviteButton` (right before the `/** Create-estimation form … */` comment that precedes `AddEstimationDialog`), insert:

```tsx
/**
 * "Public QR invite" button + dialog for the session header. Resolves a
 * temporary public developer-join URL via the ngrok sidecar (see
 * `getPublicJoinUrlAction` / `lib/server/ngrok.ts`) and renders it as a QR
 * code developers outside the local network can scan to join. Exported (not
 * module-private like `CopyInviteButton`) so it's unit-testable in isolation
 * without mounting the full `PoFlow` + SSE session stream.
 */
type QrInviteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; url: string }
  | { status: "error"; error: string };

export function QrInviteButton({ session }: { session: Session }) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<QrInviteState>({ status: "idle" });
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    setState({ status: "loading" });
    startTransition(async () => {
      const result = await getPublicJoinUrlAction(session.id);
      setState(
        result.ok
          ? { status: "success", url: result.url }
          : { status: "error", error: result.error },
      );
    });
  }, [session.id]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) load();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <QrCode aria-hidden="true" />
          Public QR invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan to join from anywhere</DialogTitle>
          <DialogDescription>
            Developers outside your local network can scan this code to join
            &ldquo;{session.name || "this session"}&rdquo; via a temporary
            public link.
          </DialogDescription>
        </DialogHeader>

        {state.status === "idle" || state.status === "loading" ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Spinner label="Generating public link…" />
            <span className="text-sm text-muted">Generating public link…</span>
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="flex items-center gap-2 rounded-card border border-warning-300/60 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-800">
              <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
              {state.error}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={pending}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-card border border-border bg-white p-3">
              <QRCode value={state.url} size={192} />
            </div>
            {!session.pin ? (
              <p className="flex items-center gap-2 rounded-card border border-warning-300/60 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800">
                <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                This session has no PIN — anyone with this link can join.
              </p>
            ) : null}
            <div className="flex w-full items-center gap-2">
              <Input
                readOnly
                value={state.url}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Public join link"
              />
              <QrCopyButton url={state.url} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Compact "copy this public URL" button — mirrors `CopyInviteButton`'s pattern. */
function QrCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("copy public invite link failed", err);
    }
  }, [url]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span className="sr-only">Copy public link</span>
    </Button>
  );
}
```

- [ ] **Step 7: Wire `QrInviteButton` into the session header**

Change:

```tsx
          <CopyInviteButton session={session} />
          <StreamStatus status={status} />
```

to:

```tsx
          <CopyInviteButton session={session} />
          <QrInviteButton session={session} />
          <StreamStatus status={status} />
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm --filter @scrum-poker/web test po-room.qr-invite.test.tsx`
Expected: PASS (2 tests). If Radix's `Dialog` throws in jsdom about a missing browser API other than `ResizeObserver`, stub that specific API the same way (a minimal no-op) directly in the test file rather than reaching for a heavier polyfill package.

- [ ] **Step 9: Typecheck + run the full web test suite**

Run: `pnpm --filter @scrum-poker/web typecheck && pnpm --filter @scrum-poker/web test`
Expected: both PASS.

- [ ] **Step 10: Commit**

```bash
git add apps/web/app/\(product-owner\)/po-room.tsx apps/web/app/\(product-owner\)/po-room.qr-invite.test.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add Public QR invite button to the PO session header"
```

---

### Task 5: Documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- None (docs only).

- [ ] **Step 1: Add a row to the root README's env var table**

In `README.md`, change:

```
| `SENTRY_DSN`             | web     | _(empty)_          | Server-side Sentry DSN (optional).                                 |
| `NEXT_PUBLIC_SENTRY_DSN` | web     | _(empty)_          | Browser Sentry DSN (optional, public).                            |

See `.env.example` for the full list. **Never commit real secrets.**
```

to:

```
| `SENTRY_DSN`             | web     | _(empty)_          | Server-side Sentry DSN (optional).                                 |
| `NEXT_PUBLIC_SENTRY_DSN` | web     | _(empty)_          | Browser Sentry DSN (optional, public).                            |
| `NGROK_AUTHTOKEN`        | ngrok   | _(empty)_          | Enables the PO's "Public QR invite" header button (get a free token at ngrok.com). Leave blank to skip; only the `ngrok` service is affected. |
| `NGROK_API_URL`          | web     | `http://ngrok:4040/api/tunnels` | ngrok local API used to resolve the current public tunnel URL. |

See `.env.example` for the full list. **Never commit real secrets.**

### Public QR invite (PO)

On `/po`, the session header has a **Public QR invite** button. It opens a
dialog with a QR code (and raw URL) that developers *outside* your local
network can scan to join the session, via the always-on `ngrok` sidecar
tunnel to the `web` container. Requires `NGROK_AUTHTOKEN` (see above) — without
it, the button shows an inline error instead of a QR code.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document the Public QR invite feature and its env vars"
```

---

### Task 6: Manual end-to-end verification (docker compose)

**Files:** none (manual verification only — requires a real secret the agent must not handle).

- [ ] **Step 1: Add your own ngrok authtoken to `.env`**

You (the user) add your free token from https://dashboard.ngrok.com/get-started/your-authtoken to the `NGROK_AUTHTOKEN=` line in `.env` (not `.env.example`) directly in your editor or terminal — do not paste it into chat.

- [ ] **Step 2: Rebuild and restart the stack**

Run: `docker compose up --build -d`
Expected: `db`, `web`, and `ngrok` all report `Up`/`healthy` in `docker compose ps`.

- [ ] **Step 3: Open the PO room and click "Public QR invite"**

Create/open a session at `http://localhost:3000/po?session=<id>`, click **Public QR invite** in the header, confirm a QR code and an `https://*.ngrok-free.app/dev?session=<id>` URL render within a few seconds.

- [ ] **Step 4: Scan the QR code from a phone on a different network (e.g. cellular data)**

Confirm it opens `/dev?session=<id>` and successfully loads the developer voting view.
