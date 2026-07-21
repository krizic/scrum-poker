/**
 * Session-id / role routing contract (shared server + client).
 *
 * ── Migration decision ───────────────────────────────────────────────────────
 * The legacy CRA app (`src/pages/start.tsx`, `src/App.tsx`) navigated to `/dev`
 * and `/po` WITHOUT the session in the path — it relied on a single implicit
 * session persisted in localStorage (`LocalSessionApi`), plus an ad-hoc
 * `?id=<id>` query it used only for the PO page.
 *
 * For the Next.js App Router port we carry the **active session id explicitly as
 * a `?session=<uuid>` query param** on both role routes:
 *
 *     Developer      → /dev?session=<sessionId>
 *     Product Owner  → /po?session=<sessionId>
 *
 * Why query param over path segment or localStorage-only:
 * - **Shareable / deep-linkable**: a teammate can be handed a URL that drops them
 *   straight into the right session + role (the whole point of planning poker).
 * - **App Router friendly**: `/dev` and `/po` already exist as route-group
 *   segments (`app/(developer)/dev`, `app/(product-owner)/po`); reading
 *   `searchParams.session` keeps them as-is without introducing a dynamic
 *   `/s/[id]/…` layer. (Request APIs like `searchParams` are async in Next 16 —
 *   pages must `await` them.)
 * - **Server-readable**: the target pages are Server Components and can read the
 *   session id from `searchParams` to fetch the session graph server-side.
 *
 * Local identity is still persisted to localStorage (see `lib/client/identity.ts`,
 * mirroring the legacy `LocalUserInfoApi`), and recently-accessed sessions are
 * mirrored client-side (see `lib/client/sessions.ts`, mirroring `LocalSessionApi`)
 * for the "Recent Sessions" parity list — but the *active* session for a route is
 * always the one in the URL.
 *
 * #15 (`/dev`) and #16 (`/po`) MUST read the active session id via
 * {@link readSessionParam} / the `SESSION_PARAM` key below.
 */

/** The query-string key that carries the active session id on `/dev` and `/po`. */
export const SESSION_PARAM = "session" as const;

/** The two role routes a user can enter a session as (legacy kept them separate). */
export type Role = "dev" | "po";

/** Path (no query) for a given role. Mirrors legacy `AppPath.Developer` / `AppPath.Po`. */
export const ROLE_PATH: Record<Role, string> = {
  dev: "/dev",
  po: "/po",
};

/**
 * Build the in-app href that enters `sessionId` as `role`, per the contract above.
 *
 * @example sessionHref("dev", "abc") // "/dev?session=abc"
 */
export function sessionHref(role: Role, sessionId: string): string {
  const params = new URLSearchParams({ [SESSION_PARAM]: sessionId });
  return `${ROLE_PATH[role]}?${params.toString()}`;
}

/**
 * Extract the active session id from a Next.js `searchParams` object.
 *
 * Next 16 `searchParams` values are `string | string[] | undefined`; a repeated
 * param yields an array, so we take the first entry. Returns `null` when absent,
 * which the role pages surface as "no session selected".
 */
export function readSessionParam(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const value = searchParams[SESSION_PARAM];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
