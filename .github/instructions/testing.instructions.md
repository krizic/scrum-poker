---
description: "Use when implementing features, changing behavior, or fixing bugs. Requires basic automated test coverage for new or changed behavior."
---
# Testing Guidelines

- Provide basic test coverage for any new or changed behavior — at minimum the happy path plus the most important edge/error case.
- Put tests alongside the existing test setup and conventions (this project uses `@testing-library/react` + Jest via `react-scripts`; test files use `*.test.ts`/`*.test.tsx`).
- For bug fixes, add a test that fails before the fix and passes after (regression test).
- Run the tests and confirm they pass before claiming the work is complete (`pnpm test`).
- Keep tests focused and meaningful — do not add trivial or redundant tests just to inflate coverage.
