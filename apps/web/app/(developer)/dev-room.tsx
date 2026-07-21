"use client";

/**
 * Developer route — client island (identity gate + live voting).
 *
 * Replaces the legacy `src/pages/developer.tsx` + `src/components/dev-estimation/*`
 * (Semantic UI + PouchDB). It is the interactive half of `/dev`; the Server
 * Component shell (`dev/page.tsx`) loads the initial session graph and hands it
 * in as `initialSession` so first paint is already hydrated with real data.
 *
 * Responsibilities (all the things that must live on the client):
 *   1. Identity gate — read `UserInfo` from localStorage (`lib/client/identity`,
 *      ported `LocalUserInfoApi`). None ⇒ render `DevSignIn` to capture it.
 *   2. Live state — subscribe to the SSE stream via `useSessionStream`; on every
 *      `change` event re-fetch the session graph through the `getSessionAction`
 *      Server Action and replace local state. This is the 1:1 replacement for the
 *      legacy PouchDB `onChange` → `getSession` loop: event → revalidate → render.
 *   3. Voting — the active estimation's deck (`DevEstimation`); a card click calls
 *      `castVoteAction` (which fires the `pg_notify` trigger → SSE → everyone
 *      converges). The picked card is reflected optimistically for snappy UX and
 *      then reconciled by the SSE-driven re-fetch.
 *   4. Presence — when an estimation becomes active and the developer has not yet
 *      voted, register presence (a value-less `castVoteAction`) so the PO sees
 *      them waiting — mirroring the legacy `onActiveEstimationChange` behavior.
 *
 * Reveal: when the PO ends/reveals the active estimation (`isEnded`), the voter
 * sees the revealed roster via `VotesTable`. PO-only controls stay out of `/dev`.
 *
 * Styling is Tailwind tokens via `@scrum-poker/ui` / `@scrum-poker/components`
 * only — no inline styles / SCSS / Semantic UI.
 */

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Toaster,
  useToast,
  cn,
} from "@scrum-poker/ui";
import { DevEstimation, DevSignIn, VotesTable } from "@scrum-poker/components";
import type {
  CardValue,
  Estimation,
  Session,
  UserInfo,
} from "@scrum-poker/types";
import { Radio, UserCog, Wifi, WifiOff } from "lucide-react";

import { getStoredUserInfo, saveUserInfo } from "@/lib/client/identity";
import { useSessionStream } from "@/lib/client/use-session-stream";
import { castVoteAction, getSessionAction } from "./actions";

/**
 * Pick the active estimation. The service enforces a single active estimation
 * per session; to match the legacy reducer (which let the *last* active win) we
 * scan from the end.
 */
function findActiveEstimation(
  session: Session | null,
): Estimation | undefined {
  const estimations = session?.estimations;
  if (!estimations) return undefined;
  for (let i = estimations.length - 1; i >= 0; i -= 1) {
    const estimation = estimations[i];
    if (estimation?.isActive) return estimation;
  }
  return undefined;
}

/** The current developer's stored vote value on `estimation`, if any. */
function currentVoteValue(
  estimation: Estimation | undefined,
  voterId: string | undefined,
): CardValue | undefined {
  if (!estimation || !voterId) return undefined;
  return estimation.votes?.find((v) => v.voterId === voterId)?.value;
}

/** Small connection indicator — reassures users the live stream is up. */
function StreamStatus({
  status,
}: {
  status: ReturnType<typeof useSessionStream>["status"];
}) {
  const live = status === "open";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        live
          ? "bg-success-50 text-success-700"
          : "bg-surface-muted text-muted",
      )}
      role="status"
      aria-live="polite"
    >
      {live ? (
        <Wifi aria-hidden="true" className="size-3.5" />
      ) : (
        <WifiOff aria-hidden="true" className="size-3.5" />
      )}
      {live ? "Live" : status === "connecting" ? "Connecting…" : "Offline"}
    </span>
  );
}

function DevFlow({
  sessionId,
  initialSession,
}: {
  sessionId: string;
  initialSession: Session;
}) {
  const { toast } = useToast();

  // Identity (localStorage). `undefined` = not read yet (first paint); `null` =
  // read, none stored (⇒ show sign-in).
  const [identity, setIdentity] = React.useState<UserInfo | null | undefined>(
    undefined,
  );
  const [editingIdentity, setEditingIdentity] = React.useState(false);

  // Live session state, seeded from the server-rendered graph (no flash).
  const [session, setSession] = React.useState<Session | null>(initialSession);

  // Optimistic selection + in-flight card for snappy feedback before the
  // SSE-driven re-fetch reconciles server state.
  const [optimisticValue, setOptimisticValue] = React.useState<
    CardValue | undefined
  >(undefined);
  const [loadingValue, setLoadingValue] = React.useState<CardValue | undefined>(
    undefined,
  );
  const [announce, setAnnounce] = React.useState("");

  // Read persisted identity on mount (browser only).
  React.useEffect(() => {
    setIdentity(getStoredUserInfo());
  }, []);

  const activeEstimation = findActiveEstimation(session);
  const serverVoteValue = currentVoteValue(activeEstimation, identity?.id ?? undefined);
  // Prefer the optimistic pick until the server confirms; otherwise server wins.
  const selectedValue = optimisticValue ?? serverVoteValue;

  // ── Live updates: revalidate the session on every SSE change event ──────────
  const revalidate = React.useCallback(async () => {
    try {
      const fresh = await getSessionAction(sessionId);
      setSession(fresh);
    } catch (err) {
      // Transient failure — the next event (or reconnect) will retry.
      console.error("dev revalidate failed", err);
    }
  }, [sessionId]);

  const { status } = useSessionStream(sessionId, {
    enabled: Boolean(session),
    onChange: () => {
      // Server state changed (vote / activation / reveal) — converge. Clearing
      // the optimistic pick lets the freshly fetched value take over.
      setOptimisticValue(undefined);
      void revalidate();
    },
  });

  // ── Presence: when an estimation is active and we haven't voted, announce ────
  // presence (value-less vote). Deduped per estimation id so the resulting
  // change event doesn't loop.
  const presenceDone = React.useRef<Set<string>>(new Set());
  const activeId = activeEstimation?.id;
  const voterId = identity?.id;
  React.useEffect(() => {
    if (!activeId || !voterId) return;
    if (serverVoteValue !== undefined) return; // already voted → already present
    if (presenceDone.current.has(activeId)) return;
    presenceDone.current.add(activeId);
    void castVoteAction(sessionId, activeId, identity as UserInfo);
  }, [activeId, voterId, serverVoteValue, sessionId, identity]);

  const handleSignIn = React.useCallback((userInfo: UserInfo) => {
    const saved = saveUserInfo(userInfo);
    setIdentity(saved);
    setEditingIdentity(false);
  }, []);

  const handleVote = React.useCallback(
    (value: CardValue) => {
      if (!activeEstimation || !identity?.id) return;
      setOptimisticValue(value);
      setLoadingValue(value);
      void (async () => {
        const result = await castVoteAction(
          sessionId,
          activeEstimation.id,
          identity,
          value,
        );
        setLoadingValue(undefined);
        if (result.ok) {
          setAnnounce(`Vote ${value} submitted.`);
        } else {
          // Roll back the optimistic pick and surface the error.
          setOptimisticValue(undefined);
          setAnnounce("");
          toast({
            variant: "danger",
            title: "Vote failed",
            description: result.error,
          });
        }
      })();
    },
    [activeEstimation, identity, sessionId, toast],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  // First paint before localStorage is read — keep markup stable (no flash).
  if (identity === undefined) {
    return (
      <p className="text-muted" aria-live="polite">
        Loading…
      </p>
    );
  }

  // Identity gate — capture a local identity before voting.
  if (!identity || editingIdentity) {
    return (
      <DevSignIn onSignIn={handleSignIn} defaultValues={identity ?? undefined} />
    );
  }

  // The session was deleted out from under us (revalidate returned null).
  if (!session) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-3 py-section text-center">
          <p className="text-base font-medium text-content">
            This session is no longer available.
          </p>
          <Button asChild variant="outline">
            <Link href="/">&larr; Back to start</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sessionName = session.name || "Untitled session";
  const revealed = Boolean(activeEstimation?.isEnded);

  return (
    <div className="flex flex-col gap-section">
      {/* Session + identity header. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Session
          </span>
          <span className="truncate text-base font-semibold text-content">
            {sessionName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StreamStatus status={status} />
          <span className="text-sm text-content">
            {identity.username || "Unknown"}
          </span>
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
      </div>

      {/* Voting deck (or waiting state when no estimation is active). */}
      <DevEstimation
        estimation={activeEstimation}
        userInfo={identity}
        selectedValue={selectedValue}
        loadingValue={loadingValue}
        onVote={handleVote}
      />

      {/* Reveal roster — visible once the PO ends/reveals the round. Developers
          see the values here; they do not get PO controls. */}
      {activeEstimation ? (
        <Card className="w-full">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">
              {revealed ? "Results" : "Voters"}
            </CardTitle>
            {!revealed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                <Radio aria-hidden="true" className="size-3.5" />
                Round in progress
              </span>
            ) : null}
          </CardHeader>
          <Separator />
          <CardContent className="pt-card">
            <VotesTable
              votes={activeEstimation.votes ?? []}
              revealed={revealed}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Polite live region announcing vote submissions to assistive tech. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <Link
        href="/"
        className="text-sm text-brand underline-offset-4 hover:underline"
      >
        &larr; Back to start
      </Link>
    </div>
  );
}

/** Public island — wraps the flow in the Toast provider (error notifications). */
export function DevRoom(props: {
  sessionId: string;
  initialSession: Session;
}) {
  return (
    <Toaster>
      <DevFlow {...props} />
    </Toaster>
  );
}
