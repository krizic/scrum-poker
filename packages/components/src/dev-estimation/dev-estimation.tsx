"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
  cn,
} from "@scrum-poker/ui";
import { Layers, Coffee } from "lucide-react";
import type { CardValue, Estimation, UserInfo } from "@scrum-poker/types";
import { PokerCard } from "../poker-card/poker-card";
import { CARD_DECK } from "../lib/deck";

export interface DevEstimationProps {
  /** The active estimation being voted on, or `undefined` when none is active. */
  estimation?: Estimation;
  /** The current developer's identity (drives the card face avatar/name). */
  userInfo: UserInfo;
  /** The value the developer has currently selected, if any. */
  selectedValue?: CardValue;
  /** The value whose vote is currently in flight (per-card spinner). */
  loadingValue?: CardValue;
  /** Fires when a card is picked. Wiring the actual vote is the route's job. */
  onVote: (value: CardValue) => void;
  /** The deck of card values. Defaults to the standard {@link CARD_DECK}. */
  deck?: readonly CardValue[];
  className?: string;
}

/**
 * DevEstimation — the developer's voting surface: the active story header plus
 * the deck of selectable poker cards. Selecting a card calls `onVote`; the
 * component itself performs no persistence (routes wire that in). Deck values
 * stay consistent with `CardValue` via {@link CARD_DECK}.
 */
export function DevEstimation({
  estimation,
  userInfo,
  selectedValue,
  loadingValue,
  onVote,
  deck = CARD_DECK,
  className,
}: DevEstimationProps) {
  if (!estimation) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center gap-3 py-section text-center">
          <span className="flex size-12 items-center justify-center rounded-pill bg-surface-muted text-muted">
            <Layers aria-hidden="true" className="size-6" />
          </span>
          <p className="text-base font-medium text-content">
            No active estimation
          </p>
          <p className="text-sm text-muted">
            Waiting for the product owner to start a round.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Once the PO ends the round (`isEnded`) voting is over — the entire deck
  // panel is hidden. Developers read the outcome from the reveal roster
  // ("Results") that the room renders below instead.
  if (estimation.isEnded) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Now estimating
        </span>
        <CardTitle className="text-xl">{estimation.name}</CardTitle>
        {estimation.description ? (
          <CardDescription className="whitespace-pre-line">
            {estimation.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <Separator />
      <CardContent className="pt-card">
        <div
          role="radiogroup"
          aria-label="Pick your estimate"
          className="flex flex-wrap justify-center gap-4"
        >
          {deck.map((value) => (
            <PokerCard
              key={value}
              side="front"
              voteValue={value}
              voterUsername={userInfo.username}
              voterEmail={userInfo.email}
              selected={value === selectedValue}
              isLoading={value === loadingValue}
              onSelect={() => onVote(value)}
              className="animate-content-in motion-reduce:animate-none"
            />
          ))}
        </div>
        <p className="mt-card flex items-center justify-center gap-1.5 text-xs text-muted">
          <Coffee aria-hidden="true" className="size-3.5" />
          Pick “?” if unsure or “☕” for a break.
        </p>
      </CardContent>
    </Card>
  );
}
