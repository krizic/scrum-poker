"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When `true` the back face is shown. Ignored when `trigger="hover"`, where
   * the flip follows pointer hover / keyboard focus instead.
   */
  revealed?: boolean;
  /** How the flip is driven. Defaults to controlled via `revealed`. */
  trigger?: "controlled" | "hover";
  /** The resting (front) face. */
  front: React.ReactNode;
  /** The revealed (back) face. */
  back: React.ReactNode;
}

const faceBase =
  "col-start-1 row-start-1 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

/**
 * Reveal / Flip — a 3D flip primitive replacing Semantic UI's `Reveal`
 * ("move" animation) used by the card-reveal component. Two faces occupy the
 * same grid cell; the inner plane rotates on the Y axis to swap them.
 *
 * Motion tokens drive the timing/easing; `prefers-reduced-motion` collapses the
 * animation to an instant swap while keeping the same end state (no vestibular
 * motion, no loss of information).
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  function Reveal(
    { className, revealed = false, trigger = "controlled", front, back, ...props },
    ref,
  ) {
    const hover = trigger === "hover";
    return (
      <div
        ref={ref}
        className={cn(
          "group relative inline-grid [perspective:1200px]",
          hover && "cursor-pointer",
          className,
        )}
        tabIndex={hover ? 0 : undefined}
        {...props}
      >
        <div
          data-revealed={revealed || undefined}
          className={cn(
            "col-start-1 row-start-1 grid transition-transform duration-slow ease-emphasized [transform-style:preserve-3d]",
            "motion-reduce:transition-none",
            hover
              ? "group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]"
              : "data-[revealed]:[transform:rotateY(180deg)]",
          )}
        >
          <div className={faceBase} aria-hidden={revealed || undefined}>
            {front}
          </div>
          <div
            className={cn(faceBase, "[transform:rotateY(180deg)]")}
            aria-hidden={!revealed || undefined}
          >
            {back}
          </div>
        </div>
      </div>
    );
  },
);
