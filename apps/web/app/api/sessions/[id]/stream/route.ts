/**
 * SSE realtime stream for one session: `GET /api/sessions/[id]/stream`.
 *
 * Read side of the realtime transport (design spec "Real-time design (SSE +
 * LISTEN/NOTIFY)", issue #12). Replaces the legacy PouchDB live change feed
 * (`ApiService.onChange` in `src/api/index.ts`) that the developer/PO pages used
 * to re-fetch on every change.
 *
 * How it works:
 * - Subscribes this response to the process-wide {@link getHub | LISTEN hub} for
 *   the requested session. The hub multiplexes ALL sessions over ONE shared pg
 *   connection — this handler never opens its own DB connection.
 * - Emits an initial `ready` event (also proves a clean open to the client), a
 *   `change` event per `pg_notify`, and a heartbeat comment every ~25s to keep
 *   proxies/idle connections alive.
 * - Each data frame carries an incrementing `id:` so `EventSource` reconnects
 *   can send `Last-Event-ID` (we don't replay history — small descriptors just
 *   trigger a client revalidate — but the id keeps reconnects well-formed).
 * - On client disconnect (`request.signal` abort) or stream cancel, it
 *   unsubscribes from the hub (which `UNLISTEN`s when it was the last client)
 *   and clears the heartbeat — no leaks.
 *
 * Runtime: MUST be the Node.js runtime (needs a long-lived TCP `pg` connection
 * via the hub) and MUST be dynamic (never cached) — an SSE stream is inherently
 * per-request and long-lived.
 */
import "server-only";

import type { NextRequest } from "next/server";
import type { SessionEvent } from "@scrum-poker/types";

import { getSession } from "@/lib/server/services";
import { getHub } from "@/lib/server/realtime/hub";

// SSE needs the Node runtime (pg TCP) and must never be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** Heartbeat interval — comfortably under common 30–60s proxy idle timeouts. */
const HEARTBEAT_MS = 25_000;

const encoder = new TextEncoder();

/** Format one SSE frame with an id + event name + JSON data payload. */
function sseFrame(id: number, event: string, data: unknown): Uint8Array {
  return encoder.encode(
    `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  // In Next 16 route `params` is async — await it.
  const { id: sessionId } = await params;

  // Clean close for a non-existent session: open the stream, tell the client,
  // and end it — never hang. (EventSource will attempt to reconnect; the page
  // layer decides whether to keep a stream open for a missing session.)
  const session = await getSession(sessionId);

  const hub = getHub();
  let eventId = 0;
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        request.signal.removeEventListener("abort", onAbort);
      };

      const safeEnqueue = (chunk: Uint8Array): boolean => {
        try {
          controller.enqueue(chunk);
          return true;
        } catch {
          // Controller already closed (client gone mid-write) — trigger cleanup.
          cleanup();
          return false;
        }
      };

      const onAbort = () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      // Initial handshake: proves a clean open and carries a "known" flag so the
      // client can distinguish a live session from a missing one.
      safeEnqueue(
        sseFrame(eventId++, "ready", {
          sessionId,
          known: session !== null,
        }),
      );

      if (!session) {
        // Nothing to listen to — close cleanly rather than hang.
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        return;
      }

      // Register with the process-wide hub; the first subscriber for this
      // session issues LISTEN "session_<id>" on the shared pg connection.
      unsubscribe = hub.subscribe(sessionId, (event: SessionEvent) => {
        safeEnqueue(sseFrame(eventId++, "change", event));
      });

      // Heartbeat comment keeps intermediaries from closing an idle stream.
      heartbeat = setInterval(() => {
        safeEnqueue(encoder.encode(": ping\n\n"));
      }, HEARTBEAT_MS);
      heartbeat.unref?.();

      // Client navigated away / closed the tab → abort → unsubscribe.
      if (request.signal.aborted) {
        onAbort();
      } else {
        request.signal.addEventListener("abort", onAbort);
      }
    },

    cancel() {
      // ReadableStream consumer went away (e.g. Response body GC'd).
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering (nginx) so events flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
