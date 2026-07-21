// Shared Vitest setup for React component/render tests across the workspace.
//
// Consumed indirectly via `@scrum-poker/config/vitest` (the `reactTestConfig`
// factory wires this file into `test.setupFiles` and enables `globals`), so
// component/route packages don't each re-implement the jsdom + Testing Library
// boilerplate.
//
// This file only registers `@testing-library/jest-dom` matchers
// (`toBeInTheDocument`, `toHaveTextContent`, …) on Vitest's `expect`. That is
// instance-agnostic (it extends Vitest's single, deduped `expect`), so it works
// no matter which package the setup file resolves from.
//
// Per-test unmount/cleanup is intentionally NOT done here: `@testing-library/
// react` auto-registers its own `afterEach(cleanup)` when a global `afterEach`
// exists — which the factory guarantees by setting `test.globals: true`. Doing
// cleanup from this file would pull in a *second* copy of Testing Library and
// clean the wrong container set.
import "@testing-library/jest-dom/vitest";
