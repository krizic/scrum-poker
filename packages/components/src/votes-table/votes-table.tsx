import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  cn,
} from "@scrum-poker/ui";
import { EyeOff, Circle } from "lucide-react";
import type { Vote } from "@scrum-poker/types";
import { isNumericCard } from "@scrum-poker/utils";
import { gravatarUrl } from "../lib/gravatar";

export interface VotesTableProps {
  /** The votes to list. */
  votes?: Vote[];
  /** When `false` the values are masked (round still in progress). */
  revealed?: boolean;
  className?: string;
}

/**
 * VotesTable — a compact roster of voters and their votes, built from the
 * `@scrum-poker/ui` Table primitives. While `revealed` is false the values are
 * masked with a lock chip (round in progress). Presentational, server-safe,
 * data-in only.
 */
export function VotesTable({
  votes = [],
  revealed = true,
  className,
}: VotesTableProps) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead>Voter</TableHead>
          <TableHead className="text-right">Vote</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {votes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={2}
              className="py-8 text-center text-sm text-muted"
            >
              No votes yet.
            </TableCell>
          </TableRow>
        ) : (
          votes.map((vote) => {
            const hasVoted = vote.value != null && vote.value !== "";
            return (
              <TableRow key={vote.id}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <img
                      src={gravatarUrl(vote.voterEmail, { size: 48 })}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      className="size-8 rounded-pill border border-border object-cover"
                    />
                    <span className="font-medium text-content">
                      {vote.voterName}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {!revealed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                      <EyeOff aria-hidden="true" className="size-3.5" />
                      {hasVoted ? "Voted" : "Waiting"}
                    </span>
                  ) : hasVoted ? (
                    <span
                      className={cn(
                        "inline-flex min-w-9 items-center justify-center rounded-button px-2.5 py-1 font-display text-base font-bold tabular-nums",
                        isNumericCard(vote.value)
                          ? "bg-brand-50 text-brand-700"
                          : "bg-surface-muted text-content",
                      )}
                    >
                      {vote.value}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Circle aria-hidden="true" className="size-3.5" />
                      No vote
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
