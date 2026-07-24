/**
 * ngrok tunnel resolution for the PO's "Public QR invite" header button
 * (`ngrok` mode — see `./public-join-url.ts` for the other mode and the
 * mode-selection logic consumed by the Server Action).
 *
 * Turns the ngrok sidecar's local API response (`docker-compose.yml`'s
 * `ngrok` service, `http://ngrok:4040/api/tunnels`) into the current public
 * tunnel URL. `parseNgrokTunnels` is pure (no I/O) so it's unit-tested
 * directly; `getNgrokTunnelUrl` wraps it with the actual `fetch` call.
 */

export type NgrokTunnelUrlResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

interface NgrokTunnel {
  proto?: unknown;
  public_url?: unknown;
}

export const NGROK_UNREACHABLE_ERROR =
  "Public link unavailable — is the app running via `docker compose` with the ngrok tunnel (NGROK_AUTHTOKEN set, `ngrok` profile enabled)?";
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
 * Resolve the current public tunnel URL via the ngrok sidecar's local API.
 * Returns a discriminated result instead of throwing so the caller can hand
 * it straight to the client for an inline error instead of a thrown-exception
 * 500.
 */
export async function getNgrokTunnelUrl(): Promise<NgrokTunnelUrlResult> {
  const apiUrl = process.env.NGROK_API_URL || "http://ngrok:4040/api/tunnels";

  let body: unknown;
  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, error: NGROK_UNREACHABLE_ERROR };
    }
    body = await res.json();
  } catch (err) {
    console.error("getNgrokTunnelUrl: ngrok API unreachable", { apiUrl }, err);
    return { ok: false, error: NGROK_UNREACHABLE_ERROR };
  }

  return parseNgrokTunnels(body);
}

