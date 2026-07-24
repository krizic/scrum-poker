# @scrum-poker/types

Shared, **framework-agnostic** TypeScript domain types for scrum-poker.

- No runtime code, no side effects — types/interfaces only.
- No framework imports and **no `@prisma/client` import**. `packages/db` owns
  Prisma and maps DB rows onto these types.
- Usable by both server and client packages.

The shapes mirror the normalized Prisma model from the Next.js migration design
spec (`Session → Estimation → Vote` as relational entities).

## Exported surface

| Export         | Kind      | Notes                                                     |
| -------------- | --------- | --------------------------------------------------------- |
| `Session`      | interface | Root aggregate; `estimations?` when loaded with relations |
| `Estimation`   | interface | Round within a session; `votes?` when loaded              |
| `Vote`         | interface | One vote per `(estimationId, voterId)`                    |
| `UserInfo`     | interface | Client identity (ported from legacy `IUserInfo`)          |
| `CardValue`    | type      | String union of the poker deck + free-form fallback       |
| `Serialized<T>`| type      | Wire form of a type after `JSON.stringify` (`Date`→`string`) |

## Date convention

Canonical domain types use JavaScript **`Date`** for timestamps (`createdAt`,
`lastUpdated`). This keeps server-side and in-memory usage simple and lossless.

When entities cross a JSON boundary (API responses, SSE payloads), `Date` fields
serialize to ISO strings. Use `Serialized<T>` to describe that wire shape instead
of redefining every interface:

```ts
import type { Session, Serialized } from "@scrum-poker/types";

type SessionDTO = Serialized<Session>; // createdAt/lastUpdated become string
```
