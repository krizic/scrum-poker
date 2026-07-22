"use client";

import { ResponsiveBar } from "@nivo/bar";
import { BarChart3 } from "lucide-react";
import { cn } from "@scrum-poker/ui";
import type { Vote } from "@scrum-poker/types";
import { STACKED_BAR_INDEX, toStackedBarChartData } from "@scrum-poker/utils";

export interface EstimationChartProps {
  /** Votes to shape into stacked segments (via `toStackedBarChartData`). */
  votes?: Vote[];
  className?: string;
}

/**
 * EstimationChart — vote distribution as a single full-width, stacked horizontal
 * bar. The data transform is owned by `toStackedBarChartData` in
 * `@scrum-poker/utils` (one segment per distinct card value, sized by count);
 * this component only renders it with `@nivo/bar`.
 *
 * A single horizontal stacked bar is far more vertical-space-efficient than the
 * previous donut (one ~5rem row vs a 320–448px square) while still showing each
 * value's share at a glance. Client-only (nivo touches the DOM). The frame uses
 * centralized Tailwind tokens; the segment palette is a nivo color scheme (data
 * passed to a third-party renderer, not app styling).
 */
export function EstimationChart({ votes, className }: EstimationChartProps) {
  const { keys, data, total } = toStackedBarChartData(votes);

  if (keys.length === 0) {
    return (
      <div
        className={cn(
          "flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-subtle text-muted",
          className,
        )}
      >
        <BarChart3 aria-hidden="true" className="size-8" />
        <p className="text-sm font-medium">No votes to chart yet</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-40 w-full rounded-card border border-border bg-surface p-card shadow-card",
        className,
      )}
      role="img"
      aria-label="Vote distribution stacked bar chart"
    >
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={STACKED_BAR_INDEX}
        layout="horizontal"
        margin={{ top: 8, right: 16, bottom: 40, left: 16 }}
        padding={0}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={{ scheme: "set2" }}
        borderRadius={0}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableGridX={false}
        enableGridY={false}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={null}
        label={(d) => `${d.id}: ${d.value}`}
        labelSkipWidth={28}
        labelSkipHeight={12}
        labelTextColor={{ from: "color", modifiers: [["darker", 2.4]] }}
        valueFormat={(value) =>
          total > 0 ? `${Math.round((value / total) * 100)}%` : `${value}`
        }
        animate
        motionConfig="gentle"
        role="application"
        ariaLabel="Vote distribution stacked bar chart"
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom",
            direction: "row",
            translateY: 36,
            itemWidth: 56,
            itemHeight: 18,
            itemsSpacing: 4,
            symbolSize: 14,
            symbolShape: "circle",
            itemTextColor: "#586a60",
            effects: [{ on: "hover", style: { itemTextColor: "#0f1a15" } }],
          },
        ]}
      />
    </div>
  );
}
