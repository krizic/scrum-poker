"use client";

/**
 * Start route — client island (create a session + local identity).
 *
 * Replaces the legacy `src/pages/start.tsx` (+ `start.scss`, Semantic UI). Flow:
 *   1. Capture identity via `DevSignIn` (username / email / pattern) and persist
 *      it to localStorage (`lib/client/identity.ts`, ported `LocalUserInfoApi`).
 *      No identity ⇒ the UI is gated behind sign-in (AC: "creating without an
 *      identity prompts for one first").
 *   2. Pick a role (Developer / Product Owner) — the role scopes the action:
 *      Product Owners CREATE a session; Developers do NOT join from here — they
 *      open the invite link the PO shares (`/dev?session=<id>`), which prompts
 *      for a PIN when the session has one (see `app/(developer)/dev-pin-gate`).
 *   3. Product Owner: create a session (optional name + PIN) via the
 *      `createSessionAction` Server Action. On success we remember the session
 *      client-side (`lib/client/sessions.ts`, ported `LocalSessionApi`) and
 *      navigate to `sessionHref(role, id)` — i.e. `/po?session=<id>`
 *      (see `lib/session-route.ts`). Developers see invite-link guidance and can
 *      reopen recent sessions.
 *   4. Create failures surface a user-facing error (Toast + inline `role="alert"`)
 *      and do NOT navigate.
 *
 * All styling is Tailwind tokens via `@scrum-poker/ui` / `@scrum-poker/components`
 * — no inline styles, SCSS, or Semantic UI.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Toaster,
  useToast,
} from "@scrum-poker/ui";
import { DevSignIn } from "@scrum-poker/components";
import type { UserInfo } from "@scrum-poker/types";
import { Clock, Code2, Info, Plus, UserCog, X } from "lucide-react";

import { getStoredUserInfo, saveUserInfo } from "@/lib/client/identity";
import {
  deleteRecentSession,
  getRecentSessions,
  saveRecentSession,
  type StoredSession,
} from "@/lib/client/sessions";
import { sessionHref, type Role } from "@/lib/session-route";
import {
  createSessionAction,
  type ActionResult,
} from "./actions";

const ROLE_LABEL: Record<Role, string> = {
  dev: "Developer",
  po: "Product Owner",
};

function StartFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  // Identity (localStorage). `undefined` = not yet read (SSR/first paint);
  // `null` = read, none stored.
  const [identity, setIdentity] = React.useState<UserInfo | null | undefined>(
    undefined,
  );
  const [editingIdentity, setEditingIdentity] = React.useState(false);
  const [recent, setRecent] = React.useState<StoredSession[] | null>(null);

  const [role, setRole] = React.useState<Role>("dev");
  const [createName, setCreateName] = React.useState("");
  const [createPin, setCreatePin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const sessionHeadingRef = React.useRef<HTMLHeadingElement>(null);

  // Load persisted identity + recent sessions on mount (browser only).
  React.useEffect(() => {
    setIdentity(getStoredUserInfo());
    setRecent(getRecentSessions());
  }, []);

  const handleSignIn = React.useCallback((userInfo: UserInfo) => {
    const saved = saveUserInfo(userInfo);
    setIdentity(saved);
    setEditingIdentity(false);
    // Focus management: move focus to the session step once identity is set.
    requestAnimationFrame(() => sessionHeadingRef.current?.focus());
  }, []);

  const navigateInto = React.useCallback(
    (result: Extract<ActionResult, { ok: true }>) => {
      const { session } = result;
      saveRecentSession({
        id: session.id,
        name: session.name ?? undefined,
        pin: session.pin ?? undefined,
        createdAt: Date.parse(session.createdAt) || Date.now(),
      });
      router.push(sessionHref(role, session.id));
    },
    [role, router],
  );

  const handleResult = React.useCallback(
    (result: ActionResult) => {
      if (result.ok) {
        setError(null);
        navigateInto(result);
      } else {
        setError(result.error);
        toast({ variant: "danger", title: "Unable to continue", description: result.error });
      }
    },
    [navigateInto, toast],
  );

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSessionAction({
        name: createName,
        pin: createPin,
      });
      handleResult(result);
    });
  };

  const handleRecentOpen = (session: StoredSession) => {
    saveRecentSession(session); // refresh recency
    router.push(sessionHref(role, session.id));
  };

  const handleRecentDelete = (
    event: React.MouseEvent,
    sessionId: string,
  ) => {
    event.stopPropagation();
    deleteRecentSession(sessionId);
    setRecent(getRecentSessions());
  };

  // ── Identity gate ──────────────────────────────────────────────────────────
  if (identity === undefined) {
    // First paint before localStorage is read — keep markup stable (no flash).
    return (
      <p className="text-muted" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!identity || editingIdentity) {
    return (
      <div className="flex flex-col gap-4">
        <DevSignIn
          onSignIn={handleSignIn}
          defaultValues={identity ?? undefined}
        />
      </div>
    );
  }

  const roleButtons = (Object.keys(ROLE_LABEL) as Role[]).map((r) => {
    const active = role === r;
    const Icon = r === "dev" ? Code2 : UserCog;
    return (
      <Button
        key={r}
        type="button"
        variant={active ? "primary" : "outline"}
        aria-pressed={active}
        onClick={() => setRole(r)}
      >
        <Icon aria-hidden="true" />
        {ROLE_LABEL[r]}
      </Button>
    );
  });

  return (
    <div className="flex flex-col gap-section">
      {/* Signed-in identity summary + change control. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-4 py-3">
        <p className="text-sm text-content">
          Signed in as{" "}
          <span className="font-semibold">
            {identity.username || "Unknown"}
          </span>
          {identity.email ? (
            <span className="text-muted"> · {identity.email}</span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditingIdentity(true)}
        >
          <UserCog aria-hidden="true" />
          Change
        </Button>
      </div>

      {/* Role selection — enter the session as Developer or Product Owner. */}
      <section aria-labelledby="role-heading" className="flex flex-col gap-2">
        <h2
          id="role-heading"
          ref={sessionHeadingRef}
          tabIndex={-1}
          className="text-sm font-medium text-content outline-none"
        >
          Enter as
        </h2>
        <div className="flex flex-wrap gap-2">{roleButtons}</div>
      </section>

      {/* Inline error, announced to assistive tech. */}
      {error ? (
        <p
          role="alert"
          className="rounded-input border border-danger/40 bg-danger-50 px-3 py-2 text-sm text-danger-700"
        >
          {error}
        </p>
      ) : null}

      {/*
        Role-scoped action. Only the Product Owner creates a session; Developers
        join an existing one by PIN (they get invited via the shared PIN).
      */}
      {role === "po" ? (
        <Card>
          <CardHeader>
            <CardTitle>New session</CardTitle>
            <CardDescription>
              Start a fresh round as Product Owner. Name and PIN are optional —
              share the PIN so developers can join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-name">Session name</Label>
                <Input
                  id="create-name"
                  name="session_name"
                  placeholder="Sprint 42 planning"
                  autoComplete="off"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-pin">Session PIN</Label>
                <Input
                  id="create-pin"
                  name="session_pin"
                  inputMode="numeric"
                  placeholder="Optional — share to let developers join"
                  autoComplete="off"
                  value={createPin}
                  onChange={(e) => setCreatePin(e.target.value)}
                />
              </div>
              <Button type="submit" loading={pending} className="self-start">
                <Plus aria-hidden="true" />
                Create session
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Join a session</CardTitle>
            <CardDescription>
              Developers join from an invite link, not a code entered here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-input border border-border bg-surface-muted px-3 py-3 text-sm text-content">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
              />
              <p>
                Ask your Product Owner for the session&rsquo;s invite link and
                open it to join. If the session has a PIN, you&rsquo;ll be asked
                for it before joining. Recently opened sessions appear below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions (parity with legacy LocalSessionApi list). */}
      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <Separator label="Recent sessions" />
        <h2 id="recent-heading" className="sr-only">
          Recent sessions
        </h2>
        {recent?.length ? (
          <ul className="flex flex-col gap-2">
            {recent
              .slice()
              .reverse()
              .map((session) => (
                <li key={session.id}>
                  <Card
                    interactive
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRecentOpen(session)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRecentOpen(session);
                      }
                    }}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Clock
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-content">
                          {session.name || "Untitled session"}
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Forget ${session.name || "session"}`}
                      onClick={(e) => handleRecentDelete(e, session.id)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </Card>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No previous sessions.</p>
        )}
      </section>
    </div>
  );
}

/** Default export — wraps the flow in the Toast provider (error notifications). */
export function StartClient() {
  return (
    <Toaster>
      <StartFlow />
    </Toaster>
  );
}
