/**
 * Public developer-join URL resolution for the PO's "Public QR invite" header
 * button — mode-aware entry point consumed by `getPublicJoinUrlAction`
 * (`app/(product-owner)/actions.ts`).
 *
 * Two modes, selected via the `PUBLIC_JOIN_URL_MODE` env var:
 * - `"ngrok"` (default) — resolve the current tunnel URL from the ngrok
 *   sidecar's local API (see `./ngrok.ts`). Convenient for local dev; the URL
 *   changes on every restart and requires the `ngrok` compose profile +
 *   `NGROK_AUTHTOKEN`.
 * - `"local"` — join `PUBLIC_BASE_URL` (a fixed domain this deployment is
 *   already reachable at, e.g. behind a real reverse proxy) with the
 *   `sessionHref` dev-join path. No ngrok container involved at all.
 *
 * Both branches build the same `sessionHref("dev", sessionId)` join path
 * (the same target the existing "Copy invite link" button uses), just with a
 * different public host.
 */
import { sessionHref } from "@/lib/session-route";
import { getNgrokTunnelUrl } from "./ngrok";

export type PublicJoinUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type PublicJoinUrlMode = "ngrok" | "local";

/** Reads `PUBLIC_JOIN_URL_MODE`; anything other than `"local"` falls back to `"ngrok"`. */
export function getPublicJoinUrlMode(): PublicJoinUrlMode {
  return process.env.PUBLIC_JOIN_URL_MODE?.trim().toLowerCase() === "local"
    ? "local"
    : "ngrok";
}

/**
 * Resolve the public developer-join URL for `sessionId`, per the configured
 * {@link PublicJoinUrlMode}. Returns a discriminated result instead of
 * throwing so the Server Action can hand it straight to the client for an
 * inline error instead of a thrown-exception 500.
 */
export async function getPublicJoinUrl(sessionId: string): Promise<PublicJoinUrlResult> {
  const devPath = sessionHref("dev", sessionId);

  if (getPublicJoinUrlMode() === "local") {
    const base = process.env.PUBLIC_BASE_URL?.trim();
    if (!base) {
      return {
        ok: false,
        error:
          'PUBLIC_BASE_URL is not set — configure it (or set PUBLIC_JOIN_URL_MODE=ngrok) to enable the Public QR invite feature.',
      };
    }
    try {
      return { ok: true, url: new URL(devPath, base).toString() };
    } catch {
      return {
        ok: false,
        error: `PUBLIC_BASE_URL ("${base}") is not a valid URL.`,
      };
    }
  }

  const tunnel = await getNgrokTunnelUrl();
  if (!tunnel.ok) {
    return tunnel;
  }
  return { ok: true, url: `${tunnel.publicUrl}${devPath}` };
}
