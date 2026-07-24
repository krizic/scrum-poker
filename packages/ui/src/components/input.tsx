import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual invalid state; also sets aria-invalid for assistive tech. */
  invalid?: boolean;
}

/**
 * Input — token-driven text field. Presentational; works in Server or Client
 * components. Pair with `<Label htmlFor>` for accessible labelling.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid = false, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          "flex h-10 w-full rounded-input border bg-surface px-3 py-2 text-sm text-content",
          "placeholder:text-muted-foreground shadow-sm transition-colors duration-fast ease-emphasized",
          "outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content",
          invalid
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30"
            : "border-border",
          className,
        )}
        {...props}
      />
    );
  },
);
