"use client";

import {
  Button,
  Card,
  CardContent,
  Separator,
  cn,
} from "@scrum-poker/ui";
import { Play, Square, Trash2, TriangleAlert } from "lucide-react";
import type { Estimation } from "@scrum-poker/types";
import { EstStatistics } from "../est-statistics/est-statistics";
import { EstimationChart } from "../estimation-chart/estimation-chart";
import { CardReveal } from "../card-reveal/card-reveal";

export interface EstimationPanelProps {
  /** The estimation round to manage/display. */
  estimation: Estimation;
  /** Activate this round (start voting). */
  onStart?: (estimation: Estimation) => void;
  /** End this round (stop voting / reveal). */
  onStop?: (estimation: Estimation) => void;
  /** Delete this round. */
  onDelete?: (estimation: Estimation) => void;
  className?: string;
}

/**
 * EstimationPanel — the product-owner management surface for a single round
 * (rebuilt from the legacy `votes-table`): start/stop/delete controls, the
 * story description, the revealed stats + chart, and the flip-card grid. All
 * data comes in via props and all actions go out via callbacks — no DB access.
 */
export function EstimationPanel({
  estimation,
  onStart,
  onStop,
  onDelete,
  className,
}: EstimationPanelProps) {
  const votes = estimation.votes ?? [];
  const hasVotes = votes.length > 0;
  const isActive = estimation.isActive;

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-2 bg-surface-subtle p-card">
        <Button
          size="sm"
          variant="primary"
          disabled={isActive}
          onClick={() => onStart?.(estimation)}
        >
          <Play aria-hidden="true" />
          Start
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={!isActive}
          onClick={() => onStop?.(estimation)}
        >
          <Square aria-hidden="true" />
          Stop
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isActive}
          onClick={() => onDelete?.(estimation)}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
        {isActive ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-pill bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <span className="size-2 animate-pulse rounded-pill bg-brand" />
            Voting live
          </span>
        ) : null}
      </div>
      <Separator />

      <CardContent className="flex flex-col gap-card pt-card">
        {estimation.description ? (
          <p className="whitespace-pre-line text-sm text-content-subtle">
            {estimation.description}
          </p>
        ) : null}

        {!hasVotes ? (
          <p className="flex items-center gap-2 rounded-card border border-warning-300/60 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-800">
            <TriangleAlert aria-hidden="true" className="size-4" />
            There are no votes for this story.
          </p>
        ) : (
          <>
            {!isActive ? (
              <div className="grid gap-card md:grid-cols-2">
                <EstStatistics estimation={estimation} />
                <EstimationChart votes={votes} />
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {votes.map((vote) => (
                <CardReveal
                  key={vote.id}
                  vote={vote}
                  shouldHide={isActive}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
