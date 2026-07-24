"use client";

/**
 * `useSessionStream` — client hook over the SSE realtime stream (issue #12).
 *
 * Subscribes to `GET /api/sessions/[id]/stream` via the browser's native
 * `EventSource` and surfaces a small "something changed" signal that route pages
 * (#14–16) use to revalidate — reproducing the legacy PouchDB `onChange`
 * behavior 1:1 (`db.changes({ since: "now", live: true })` →
 * re-fetch-on-change in `src/pages/{developer,po-page}.tsx`).
 *
 * Deliberately generic: it does NOT re-fetch session data itself. Consumers pass
 * an `onChange` callback (e.g. `router.refresh()`, a SWR `mutate`, or a Server
 * Action re-fetch) which fires on every `change` event. It also exposes the
 * latest event, a monotonically increasing `revalidateSignal` (handy as a
 * `useEffect` dependency), and the connection `status`.
 *
 * Reconnects: `EventSource` reconnects automatically and, because the server
 * stamps each frame with an `id:`, the browser resends `Last-Event-ID` on
 * reconnect for free. We only surface status transitions; no manual retry loop.
 */
import { useEffect, useRef, useState } from "react";
import type { SessionEvent } from "@scrum-poker/types";

/** Connection lifecycle state exposed to consumers. */
export type SessionStreamStatus = "connecting" | "open" | "closed";

export interface UseSessionStreamOptions {
  /**
   * Called on every `change` event (a Session/Estimation/Vote write). This is
   * the revalidation hook — typically `() => router.refresh()`.
   */
  onChange?: (event: SessionEvent) => void;
  /** Fired once the stream is open and the server sent its `ready` handshake. */
  onReady?: (info: { sessionId: string; known: boolean }) => void;
  /**
   * When `false`, the hook does not open a connection (e.g. before an id is
   * known). Defaults to `true`.
   */
  enabled?: boolean;
}

export interface UseSessionStream {
  /** The most recent `change` event, or `null` before any arrive. */
  lastEvent: SessionEvent | null;
  /**
   * Monotonic counter bumped on every `change` event. Use it as a `useEffect`
   * dependency to trigger a re-fetch without wiring a callback.
   */
  revalidateSignal: number;
  /** Current connection status. */
  status: SessionStreamStatus;
}

/**
 * Subscribe to a session's realtime change stream.
 *
 * @param sessionId - the session to stream, or `null`/`undefined` to stay idle.
 * @param options - `onChange` revalidation callback and connection controls.
 */
export function useSessionStream(
  sessionId: string | null | undefined,
  options: UseSessionStreamOptions = {},
): UseSessionStream {
  const { enabled = true } = options;

  const [lastEvent, setLastEvent] = useState<SessionEvent | null>(null);
  const [revalidateSignal, setRevalidateSignal] = useState(0);
  const [status, setStatus] = useState<SessionStreamStatus>("closed");

  // Keep callbacks in refs so re-renders don't tear down / rebuild the stream.
  const onChangeRef = useRef(options.onChange);
  const onReadyRef = useRef(options.onReady);
  onChangeRef.current = options.onChange;
  onReadyRef.current = options.onReady;

  useEffect(() => {
    if (!enabled || !sessionId) {
      setStatus("closed");
      return;
    }

    setStatus("connecting");
    const url = `/api/sessions/${encodeURIComponent(sessionId)}/stream`;
    const source = new EventSource(url);

    source.addEventListener("open", () => setStatus("open"));

    source.addEventListener("ready", (e: MessageEvent<string>) => {
      setStatus("open");
      try {
        const info = JSON.parse(e.data) as { sessionId: string; known: boolean };
        onReadyRef.current?.(info);
      } catch {
        // Ignore malformed handshake.
      }
    });

    source.addEventListener("change", (e: MessageEvent<string>) => {
      let event: SessionEvent;
      try {
        event = JSON.parse(e.data) as SessionEvent;
      } catch {
        return;
      }
      setLastEvent(event);
      setRevalidateSignal((n) => n + 1);
      onChangeRef.current?.(event);
    });

    source.addEventListener("error", () => {
      // EventSource auto-reconnects; reflect that we're re-establishing unless
      // it has permanently closed.
      setStatus(source.readyState === EventSource.CLOSED ? "closed" : "connecting");
    });

    return () => {
      source.close();
      setStatus("closed");
    };
  }, [sessionId, enabled]);

  return { lastEvent, revalidateSignal, status };
}
