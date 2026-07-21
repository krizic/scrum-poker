/**
 * `@scrum-poker/types` — shared, framework-agnostic domain types.
 *
 * These types mirror the normalized Prisma model (Session → Estimation → Vote
 * as relational entities) described in the Next.js migration design spec. They
 * are the contract shared by both server and client packages.
 *
 * Rules:
 * - No runtime code, no side effects — types/interfaces only.
 * - No framework imports and no `@prisma/client` import. `packages/db` (issue
 *   #8) owns Prisma and maps DB rows onto these types.
 *
 * Date convention:
 * - The canonical domain types use JavaScript `Date` for timestamps
 *   (`createdAt`, `lastUpdated`). This keeps server-side and in-memory usage
 *   simple and lossless.
 * - When these entities cross a JSON boundary (API responses, SSE payloads),
 *   `Date` fields serialize to ISO strings. Use the `Serialized<T>` helper to
 *   describe that wire shape without redefining every interface.
 */

/**
 * A card value shown on a poker card. Kept as a string union of the common
 * planning-poker deck plus a free-form fallback so custom decks stay valid.
 * `?` and `☕` (coffee) are conventional "unsure" / "break" cards.
 */
export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "5"
  | "8"
  | "13"
  | "20"
  | "40"
  | "100"
  | "?"
  | "☕"
  | (string & {});

/**
 * A planning-poker session. Root aggregate that owns estimations.
 */
export interface Session {
  id: string;
  name?: string;
  pin?: string;
  createdAt: Date;
  lastUpdated: Date;
  /** Populated when the session is loaded with its relations. */
  estimations?: Estimation[];
}

/**
 * A single estimation round within a session. Only one estimation per session
 * may be active at a time (enforced server-side, not by the type system).
 */
export interface Estimation {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isEnded: boolean;
  createdAt: Date;
  /** Populated when the estimation is loaded with its relations. */
  votes?: Vote[];
}

/**
 * A single participant's vote within an estimation. Unique per
 * `(estimationId, voterId)` — one vote per user per estimation.
 */
export interface Vote {
  id: string;
  estimationId: string;
  /** Client-generated identity id (see {@link UserInfo.id}). */
  voterId: string;
  voterName: string;
  voterEmail: string;
  pattern: string;
  /** Absent until the voter has picked a card / while a round is hidden. */
  value?: CardValue;
  createdAt: Date;
}

/**
 * Client-side identity of the current user, persisted in local storage.
 * Ported from the legacy `IUserInfo`. Fields are optional because the identity
 * is built up incrementally in the sign-in flow before it is complete.
 */
export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  pattern?: string;
}

/**
 * Recursively replaces `Date` fields with `string` (their JSON form), for
 * describing the wire shape of the domain types after `JSON.stringify`.
 *
 * @example
 * type SessionDTO = Serialized<Session>; // createdAt/lastUpdated become string
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;
