import * as React from "react";
import { cn } from "@scrum-poker/ui";
import type { Estimation } from "@scrum-poker/types";
import {
  computeEstimationStatistics,
  formatAverage,
  formatMinMax,
  formatVotedRatio,
} from "@scrum-poker/utils";
import { Sigma, ArrowLeftRight, Users } from "lucide-react";

export interface EstStatisticsProps {
  /** The estimation whose votes are aggregated. */
  estimation: Pick<Estimation, "votes">;
  className?: string;
}

interface StatCell {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

/**
 * EstStatistics — average / min-max / voted-ratio readout for an estimation,
 * fed entirely by `computeEstimationStatistics` + formatters from
 * `@scrum-poker/utils` (no local vote-math). Presentational and server-safe.
 */
export function EstStatistics({ estimation, className }: EstStatisticsProps) {
  const stats = computeEstimationStatistics(estimation);
  const minMax =
    stats.min === null || stats.max === null
      ? null
      : { min: stats.min, max: stats.max };

  const cells: StatCell[] = [
    {
      icon: <Sigma aria-hidden="true" />,
      label: "Average",
      value: formatAverage(stats.average),
      highlight: true,
    },
    {
      icon: <ArrowLeftRight aria-hidden="true" />,
      label: "Min – Max",
      value: formatMinMax(minMax),
    },
    {
      icon: <Users aria-hidden="true" />,
      label: "Voted",
      value: formatVotedRatio(stats.numericCount, stats.totalVotes),
    },
  ];

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-3",
        className,
      )}
    >
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={cn(
            "flex flex-col items-center gap-1 rounded-card border border-border bg-surface p-card text-center shadow-card",
            cell.highlight && "border-brand/40 bg-brand-50",
          )}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-pill bg-surface-muted text-muted [&_svg]:size-4",
              cell.highlight && "bg-brand text-brand-foreground",
            )}
          >
            {cell.icon}
          </span>
          <dd
            className={cn(
              "font-display text-2xl font-bold tabular-nums text-content",
              cell.highlight && "text-brand-700",
            )}
          >
            {cell.value}
          </dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            {cell.label}
          </dt>
        </div>
      ))}
      {stats.hasConsensus && stats.totalVotes > 0 ? (
        <p className="col-span-full inline-flex items-center justify-center gap-2 rounded-pill bg-success-50 px-3 py-1.5 text-sm font-medium text-success-700">
          <Users aria-hidden="true" className="size-4" />
          Consensus reached
        </p>
      ) : null}
    </dl>
  );
}
