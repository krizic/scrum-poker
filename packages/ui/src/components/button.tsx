"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "rounded-button select-none transition-colors duration-fast ease-emphasized " +
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 " +
  "motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground shadow-card hover:bg-brand-600 active:bg-brand-700",
  secondary:
    "bg-surface-muted text-content hover:bg-surface-sunken active:bg-surface-sunken",
  outline:
    "border border-border bg-surface text-content hover:bg-surface-subtle hover:border-border-strong",
  ghost: "bg-transparent text-content hover:bg-surface-muted",
  danger:
    "bg-danger text-danger-foreground shadow-card hover:bg-danger-700 active:bg-danger-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm [&_svg]:size-4",
  md: "h-10 px-4 text-sm [&_svg]:size-4",
  lg: "h-12 px-6 text-base [&_svg]:size-5",
  icon: "size-10 [&_svg]:size-5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as the single child element (Radix Slot) instead of a `<button>`. */
  asChild?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(base, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2
            className="animate-spin-slow motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </Comp>
    );
  },
);
