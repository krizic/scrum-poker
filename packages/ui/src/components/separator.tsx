"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../lib/cn";

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Optional centered label, rendered on a horizontal separator only. */
  label?: React.ReactNode;
}

/**
 * Separator / Divider — Radix Separator (replaces Semantic UI `Divider`).
 * Decorative by default; pass `decorative={false}` for a semantic separator.
 * Supports an optional centered label like Semantic's "horizontal" divider.
 */
export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(function Separator(
  { className, orientation = "horizontal", decorative = true, label, ...props },
  ref,
) {
  if (label && orientation === "horizontal") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted",
          className,
        )}
        role={decorative ? "presentation" : "separator"}
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span>{label}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});
