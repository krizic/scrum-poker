"use client";

import * as React from "react";
import { Spinner, cn } from "@scrum-poker/ui";
import { gravatarUrl } from "../lib/gravatar";
import { cardBackStyle, DEFAULT_PATTERN } from "../lib/deck";

export interface PokerCardProps {
  /** Which face to render. `front` shows the value; `back` shows the pattern. */
  side: "front" | "back";
  /** The card value shown on the front face (e.g. "5", "?"). */
  voteValue?: string;
  voterUsername?: string;
  voterEmail?: string;
  /** Card-back pattern id (a CSS pattern from `@scrum-poker/components` deck). */
  voterPattern?: string;
  /** Show the voter's gravatar + name on the face. */
  withProfilePic?: boolean;
  /** Front face: swap the value for a spinner (per-card vote in flight). */
  isLoading?: boolean;
  /** Back face: dim + spinner overlay while the voter hasn't picked yet. */
  loading?: boolean;
  /** Marks the card as the current selection (deck highlight). */
  selected?: boolean;
  /** Fires with `voteValue` when the card is activated (makes it a button). */
  onSelect?: (value: string | undefined) => void;
  className?: string;
  /** Extra content rendered on the back face (e.g. the voter name banner). */
  children?: React.ReactNode;
}

function Avatar({
  email,
  size = 80,
  className,
}: {
  email?: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={gravatarUrl(email, { size })}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={cn(
        "size-14 rounded-pill border-2 border-surface object-cover shadow-card",
        className,
      )}
    />
  );
}

/**
 * PokerCard — the planning-poker card, rebuilt in Tailwind on centralized
 * tokens (replaces the Semantic UI + SCSS legacy card). Two faces:
 *
 * - `front`: the estimate value on the Cardo display face, or a spinner while a
 *   vote is submitting; optional voter avatar + name.
 * - `back`: the decorative pattern back with the voter's avatar/name, and an
 *   optional dimmed "waiting to vote" overlay.
 *
 * Purely presentational + callback-driven — it never touches services/DB. When
 * `onSelect` is provided it renders as an accessible `<button>`.
 */
export const PokerCard = React.forwardRef<HTMLElement, PokerCardProps>(
  function PokerCard(
    {
      side,
      voteValue,
      voterUsername,
      voterEmail,
      voterPattern = DEFAULT_PATTERN,
      withProfilePic = false,
      isLoading = false,
      loading = false,
      selected = false,
      onSelect,
      className,
      children,
    },
    ref,
  ) {
    const interactive = typeof onSelect === "function";
    const Comp: React.ElementType = interactive ? "button" : "div";

    const shell = cn(
      "group relative block h-poker-h w-poker-w overflow-hidden rounded-card text-content",
      "transition-[transform,box-shadow] duration-base ease-emphasized motion-reduce:transition-none",
      interactive &&
        "cursor-pointer shadow-card hover:-translate-y-1 hover:shadow-elevated " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      selected && "ring-2 ring-brand ring-offset-2 ring-offset-surface",
      className,
    );

    if (side === "front") {
      return (
        <Comp
          ref={ref as never}
          type={interactive ? "button" : undefined}
          onClick={interactive ? () => onSelect?.(voteValue) : undefined}
          aria-pressed={interactive ? selected : undefined}
          aria-label={
            interactive && voteValue ? `Vote ${voteValue}` : undefined
          }
          className={cn(
            shell,
            "border border-border bg-surface-gradient p-2",
            selected && "bg-brand text-brand-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-full w-full flex-col items-center justify-around rounded-[0.5rem] p-3",
              "bg-surface-subtle/70 ring-1 ring-inset ring-border/60",
              selected && "bg-brand-600/20 ring-brand-foreground/30",
            )}
          >
            {isLoading ? (
              <Spinner size="lg" label="Submitting vote…" />
            ) : (
              <span
                className={cn(
                  "font-display text-card-face font-bold tabular-nums",
                  selected ? "text-brand-foreground" : "text-content",
                )}
              >
                {voteValue}
              </span>
            )}
            {withProfilePic ? (
              <span className="flex w-full flex-col items-center gap-1">
                <Avatar email={voterEmail} />
                <span className="w-full truncate text-center text-sm font-medium">
                  {voterUsername}
                </span>
              </span>
            ) : null}
          </span>
        </Comp>
      );
    }

    // back
    return (
      <Comp
        ref={ref as never}
        type={interactive ? "button" : undefined}
        onClick={interactive ? () => onSelect?.(voteValue) : undefined}
        className={cn(
          shell,
          "border border-brand-900/40 bg-surface-inverse shadow-card",
        )}
      >
        {/* Decorative CSS pattern back (no image asset — always crisp). */}
        <span
          aria-hidden="true"
          style={cardBackStyle(voterPattern)}
          className="absolute inset-0"
        />
        {/* Premium inset frame: soft light edge over a subtle dark vignette. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-card shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),inset_0_0_28px_rgba(0,0,0,0.35)]"
        />
        <span className="relative flex h-full w-full flex-col items-center justify-around p-3">
          {withProfilePic ? <Avatar email={voterEmail} /> : null}
          {children ? (
            <span className="absolute inset-x-0 bottom-0 truncate bg-surface-inverse/70 px-2 py-2 text-center text-sm font-medium text-content-inverse backdrop-blur-sm">
              {children}
            </span>
          ) : null}
        </span>

        {loading ? (
          <span
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-inverse/70 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            {withProfilePic ? <Avatar email={voterEmail} /> : null}
            <Spinner size="lg" label="Waiting for vote…" className="text-brand-200" />
          </span>
        ) : null}
      </Comp>
    );
  },
);
