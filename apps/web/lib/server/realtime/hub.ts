/**
 * Per-process Postgres LISTEN/NOTIFY fan-out hub (server-only).
 *
 * This is the read side of the SSE realtime transport described in the design
 * spec ("Real-time design (SSE + LISTEN/NOTIFY)"). It replaces the legacy
 * PouchDB live change feed (`ApiService.onChange`, `db.changes({ since: "now",
 * live: true })` in `src/api/index.ts`) that the developer/PO pages subscribed
 * to in order to re-fetch on any change.
 *
 * Design (matches the spec + issue #12 exactly):
 * - ONE dedicated, long-lived `pg` Client per Node process — NOT Prisma, NOT a
 *   connection per SSE client. Opening a connection per subscriber would defeat
 *   the whole design, so all sessions multiplex over this single connection.
 * - An in-memory `Map<sessionId, Set<Subscriber>>`. A "subscriber" is just a
 *   callback that receives parsed {@link SessionEvent}s for one session.
 * - Reference counting: we `LISTEN "session_<id>"` when the FIRST subscriber for
 *   a session arrives and `UNLISTEN "session_<id>"` when the LAST one leaves.
 * - On a `NOTIFY`, the payload (emitted by the DB triggers as JSON text) is
 *   parsed and fanned out to every subscriber of that session.
 * - Resilience: on the pg client's `error`/`end`, we reconnect with capped
 *   exponential backoff and re-`LISTEN` every currently-active channel, so
 *   subscribers keep receiving events without re-subscribing (no leaks, no
 *   duplicate deliveries).
 *
 * Channel naming: the trigger calls `pg_notify('session_' || sessionId, json)`.
 * `pg_notify` does not require a valid SQL identifier, but the `LISTEN` /
 * `UNLISTEN` *statements* do — and session ids are UUIDs containing dashes, so
 * the channel MUST be double-quoted: `LISTEN "session_<uuid>"`. We quote it
 * (escaping any embedded quotes) to stay byte-for-byte aligned with what the
 * trigger emits.
 */
import "server-only";

import { Client } from "pg";
import type { Notification } from "pg";
import type { SessionEvent } from "@scrum-poker/types";

/** A subscriber callback: receives every event for the session it subscribed to. */
export type Subscriber = (event: SessionEvent) => void;

/**
 * The minimal slice of a `pg` `Client` the hub actually uses. Declaring it
 * explicitly keeps the hub decoupled from the full `pg.Client` surface and lets
 * tests inject a lightweight fake without casting. The real `pg.Client`
 * structurally satisfies this interface.
 */
export interface ListenClient {
  connect(): Promise<unknown>;
  query(queryText: string): Promise<unknown>;
  end(): Promise<void>;
  on(event: string, listener: (...args: unknown[]) => void): unknown;
}

/** The channel prefix the DB triggers use: `pg_notify('session_' || id, …)`. */
const CHANNEL_PREFIX = "session_";

/** Reconnect backoff schedule (ms), capped at the last value. */
const BACKOFF_MS = [250, 500, 1000, 2000, 5000, 10000] as const;

/** Build the LISTEN/UNLISTEN channel name for a session id. */
function channelName(sessionId: string): string {
  return `${CHANNEL_PREFIX}${sessionId}`;
}

/**
 * Quote a channel as a SQL identifier. UUIDs contain dashes so the quotes are
 * mandatory for `LISTEN`/`UNLISTEN`; embedded double quotes are doubled per SQL
 * identifier escaping rules (defensive — session ids are UUIDs, never quoted).
 */
function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * The hub. A single instance is shared per process (see {@link getHub}); the
 * class is exported so tests can construct isolated instances with a fake pg
 * client factory.
 */
export class RealtimeHub {
  /** sessionId → set of subscriber callbacks. */
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  /** The single shared pg client, or null while (re)connecting. */
  private client: ListenClient | null = null;

  /** In-flight connect promise, so concurrent subscribes share one connect. */
  private connecting: Promise<void> | null = null;

  /** Whether the hub has been shut down (stops reconnect loops). */
  private closed = false;

  /** Current reconnect attempt index (for backoff). Reset on a clean connect. */
  private reconnectAttempt = 0;

  /**
   * @param createClient - factory for the pg client. Defaults to a real `pg`
   *   `Client` reading `DATABASE_URL`. Injectable so unit tests can drive a fake.
   */
  constructor(
    private readonly createClient: () => ListenClient = () =>
      new Client({ connectionString: process.env.DATABASE_URL }),
  ) {}

  /** Number of sessions with at least one active subscriber (introspection). */
  get activeSessionCount(): number {
    return this.subscribers.size;
  }

  /** Total subscribers for a session (0 if none). Test/introspection helper. */
  subscriberCount(sessionId: string): number {
    return this.subscribers.get(sessionId)?.size ?? 0;
  }

  /**
   * Subscribe to a session's realtime events. Returns an idempotent unsubscribe
   * function. The FIRST subscriber for a session triggers `LISTEN`; the LAST to
   * unsubscribe triggers `UNLISTEN`.
   */
  subscribe(sessionId: string, subscriber: Subscriber): () => void {
    let set = this.subscribers.get(sessionId);
    const isFirst = !set || set.size === 0;

    if (!set) {
      set = new Set();
      this.subscribers.set(sessionId, set);
    }
    set.add(subscriber);

    if (isFirst) {
      // Fire-and-forget; connection errors are handled by the reconnect loop,
      // which re-LISTENs every active channel once reconnected.
      void this.listen(sessionId);
    }

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.removeSubscriber(sessionId, subscriber);
    };
  }

  private removeSubscriber(sessionId: string, subscriber: Subscriber): void {
    const set = this.subscribers.get(sessionId);
    if (!set) return;
    set.delete(subscriber);
    if (set.size === 0) {
      this.subscribers.delete(sessionId);
      void this.unlisten(sessionId);
    }
  }

  /**
   * Ensure the shared pg client is connected, wiring up its lifecycle handlers.
   * Returns the live client (or `null` if closed / still failing) so callers get
   * a freshly-typed reference rather than relying on `this.client` narrowing.
   */
  private async ensureConnected(): Promise<ListenClient | null> {
    if (this.closed) return null;
    if (this.client) return this.client;
    if (this.connecting) {
      await this.connecting;
      return this.client;
    }

    this.connecting = (async () => {
      const client = this.createClient();

      client.on("notification", (msg) =>
        this.onNotification(msg as Notification),
      );
      // A dropped connection surfaces as 'error' and/or 'end'; either one
      // schedules a reconnect. `handleDisconnect` ignores stale generations.
      client.on("error", () => this.handleDisconnect(client));
      client.on("end", () => this.handleDisconnect(client));

      await client.connect();
      this.client = client;
      this.reconnectAttempt = 0;
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
    return this.client;
  }

  /** `LISTEN "session_<id>"` for a session (connecting first if needed). */
  private async listen(sessionId: string): Promise<void> {
    try {
      const client = await this.ensureConnected();
      // A reconnect may have happened between subscribe() and here; if the
      // session no longer has subscribers, skip. If the client is gone, the
      // reconnect loop will re-LISTEN everything.
      if (!client || !this.subscribers.has(sessionId)) return;
      await client.query(`LISTEN ${quoteIdent(channelName(sessionId))}`);
    } catch {
      // Swallow: a disconnect during LISTEN triggers reconnect + re-LISTEN.
    }
  }

  /** `UNLISTEN "session_<id>"` for a session (best effort). */
  private async unlisten(sessionId: string): Promise<void> {
    try {
      if (!this.client) return;
      await this.client.query(`UNLISTEN ${quoteIdent(channelName(sessionId))}`);
    } catch {
      // Swallow: on reconnect we only re-LISTEN active channels, so a failed
      // UNLISTEN cannot resurrect a dropped subscription.
    }
  }

  /** Parse and fan out an incoming NOTIFY to the session's subscribers. */
  private onNotification(msg: Notification): void {
    if (!msg.channel.startsWith(CHANNEL_PREFIX)) return;
    const sessionId = msg.channel.slice(CHANNEL_PREFIX.length);
    const set = this.subscribers.get(sessionId);
    if (!set || set.size === 0) return;

    let event: SessionEvent;
    try {
      event = JSON.parse(msg.payload ?? "{}") as SessionEvent;
    } catch {
      return; // Ignore malformed payloads rather than crash the process.
    }

    // Snapshot to tolerate subscribers unsubscribing during iteration.
    for (const subscriber of [...set]) {
      try {
        subscriber(event);
      } catch {
        // One bad subscriber must not starve the others.
      }
    }
  }

  /** Handle a dropped/ended connection: drop the client and reconnect. */
  private handleDisconnect(client: ListenClient): void {
    // Ignore stale handlers from a previous client generation.
    if (this.client && this.client !== client) return;
    this.client = null;
    if (this.closed) return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    const delay =
      BACKOFF_MS[Math.min(this.reconnectAttempt, BACKOFF_MS.length - 1)];
    this.reconnectAttempt += 1;
    const timer = setTimeout(() => {
      void this.reconnect();
    }, delay);
    // Don't keep the process alive purely for a reconnect timer.
    timer.unref?.();
  }

  /** Reconnect and re-LISTEN every channel that still has subscribers. */
  private async reconnect(): Promise<void> {
    if (this.closed || this.client) return;
    // No point reconnecting if nobody is listening; the next subscribe() will.
    if (this.subscribers.size === 0) return;

    let client: ListenClient | null;
    try {
      client = await this.ensureConnected();
    } catch {
      this.scheduleReconnect();
      return;
    }

    if (!client) {
      this.scheduleReconnect();
      return;
    }

    // Re-arm every active channel on the fresh connection.
    try {
      for (const sessionId of this.subscribers.keys()) {
        await client.query(`LISTEN ${quoteIdent(channelName(sessionId))}`);
      }
    } catch {
      // Lost it again mid re-LISTEN; the disconnect handler will schedule anew.
    }
  }

  /** Shut the hub down: stop reconnecting and close the shared client. */
  async close(): Promise<void> {
    this.closed = true;
    this.subscribers.clear();
    const client = this.client;
    this.client = null;
    if (client) {
      try {
        await client.end();
      } catch {
        // Ignore errors while closing.
      }
    }
  }
}

/**
 * Process-wide singleton accessor. Stored on `globalThis` so Next.js dev-mode
 * hot reloads reuse the same hub (and its single pg connection) instead of
 * leaking a new listener connection on every reload — same pattern the Prisma
 * client singleton uses.
 */
type HubGlobal = typeof globalThis & { __scrumPokerRealtimeHub__?: RealtimeHub };
const globalForHub = globalThis as HubGlobal;

export function getHub(): RealtimeHub {
  if (!globalForHub.__scrumPokerRealtimeHub__) {
    globalForHub.__scrumPokerRealtimeHub__ = new RealtimeHub();
  }
  return globalForHub.__scrumPokerRealtimeHub__;
}
