"use client";

import { Reveal } from "@scrum-poker/ui";
import type { Vote } from "@scrum-poker/types";
import { PokerCard } from "../poker-card/poker-card";

export interface CardRevealProps {
  /** The vote to display. */
  vote: Vote;
  /** While `true` the value stays hidden (round in progress); flips on reveal. */
  shouldHide: boolean;
  /** Show the voter's avatar on both faces. Defaults to `true`. */
  withProfilePic?: boolean;
  className?: string;
}

/**
 * CardReveal — flips a voter's card between the hidden pattern back (round in
 * progress) and the revealed value front, using the token-driven
 * `@scrum-poker/ui` {@link Reveal} primitive (replaces Semantic UI's `Reveal`
 * "move" animation). Presentational + data-in only.
 */
export function CardReveal({
  vote,
  shouldHide,
  withProfilePic = true,
  className,
}: CardRevealProps) {
  return (
    <Reveal
      className={className}
      revealed={!shouldHide}
      front={
        <PokerCard
          side="back"
          withProfilePic={withProfilePic}
          loading={!vote.value}
          voterEmail={vote.voterEmail}
          voterUsername={vote.voterName}
          voterPattern={vote.pattern}
        >
          {vote.voterName}
        </PokerCard>
      }
      back={
        <PokerCard
          side="front"
          withProfilePic={withProfilePic}
          voterEmail={vote.voterEmail}
          voterUsername={vote.voterName}
          voteValue={shouldHide ? "?" : (vote.value ?? "-")}
        />
      }
    />
  );
}
