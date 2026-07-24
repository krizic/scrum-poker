// Ambient type augmentation for `@testing-library/jest-dom`'s Vitest matchers
// (`toBeInTheDocument`, `toHaveTextContent`, …).
//
// `@scrum-poker/config/vitest-setup` registers the matchers themselves at
// *runtime* (imported once via `setupFiles`), but that file lives in a
// different package/tsconfig program, so its `declare module` augmentation of
// Vitest's `Assertion` interface never reaches `apps/web`'s own `tsc`
// invocation. This file's sole purpose is to pull that augmentation into this
// app's program (see `app/(product-owner)/po-room.qr-invite.test.tsx`).
import "@testing-library/jest-dom/vitest";
