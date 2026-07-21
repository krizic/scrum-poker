import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
  /** Accessible loading text (visually hidden). */
  label?: string;
}

/**
 * Spinner / Loading — token-driven loading indicator (replaces Semantic UI's
 * `Loader`). Respects `prefers-reduced-motion` by pausing the animation.
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  function Spinner({ className, size = "md", label = "Loading…", ...props }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center justify-center text-brand", className)}
        {...props}
      >
        <Loader2
          className={cn(
            "animate-spin-slow motion-reduce:animate-none",
            sizeMap[size],
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);
