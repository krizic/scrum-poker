"use client";

/**
 * Client-side local identity storage.
 *
 * Ports `src/services/local-user-storage.ts` (`LocalUserInfoApi` / `IUserInfo`)
 * to the migrated stack. Semantics are preserved 1:1:
 * - Stored under the same localStorage key (`sp_user`) as a JSON blob.
 * - The identity `id` is generated **once** and then reused (it backs the
 *   `voterId` uniqueness — one vote per user per estimation — in the new model).
 * - `username` / `email` / `pattern` are optional display fields.
 *
 * The domain shape is now `@scrum-poker/types`' `UserInfo` (same fields as the
 * legacy `IUserInfo`). This identity is captured on the Start route (#14) and
 * consumed when voting (#15).
 *
 * `"use client"` + `typeof window` guards keep every access browser-only; called
 * from Server Components these would throw, so callers use them inside effects /
 * event handlers only.
 */
import type { UserInfo } from "@scrum-poker/types";

/** localStorage key — identical to the legacy `userInfoKey` for continuity. */
export const USER_INFO_KEY = "sp_user";

/** Read the stored identity, or `null` when none/unavailable/corrupt. */
export function getStoredUserInfo(): UserInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

/**
 * Persist the identity. Ensures an `id` exists (generated once with the Web
 * Crypto API — replacing the legacy `uuid` dependency), preserving any id from
 * `userInfo` so a returning user keeps the same `voterId`.
 */
export function saveUserInfo(userInfo: UserInfo): UserInfo {
  const withId: UserInfo = {
    ...userInfo,
    id: userInfo.id ?? getStoredUserInfo()?.id ?? crypto.randomUUID(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(withId));
  }
  return withId;
}
