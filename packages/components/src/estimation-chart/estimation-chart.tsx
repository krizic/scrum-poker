"use client";

import { ResponsivePie } from "@nivo/pie";
import { BarChart3 } from "lucide-react";
import { cn } from "@scrum-poker/ui";
import type { Vote } from "@scrum-poker/types";
import { toPieChartData } from "@scrum-poker/utils";

export interface EstimationChartProps {
  /** Votes to shape into pie slices (via `toPieChartData` from utils). */
  votes?: Vote[];
  className?: string;
}

/**
 * EstimationChart — vote distribution as a pie chart. The data transform is
 * owned by `toPieChartData` in `@scrum-poker/utils`; this component only renders
 * it with `@nivo/pie`. Client-only (nivo touches the DOM). The surrounding
 * frame/typography use centralized Tailwind tokens; the slice palette is a nivo
 * color scheme (data passed to a third-party renderer, not app styling).
 */
export function EstimationChart({ votes, className }: EstimationChartProps) {
  const data = toPieChartData(votes);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-80 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-subtle text-muted",
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
        "h-80 rounded-card border border-border bg-surface p-card shadow-card sm:h-96",
        className,
      )}
      role="img"
      aria-label="Vote distribution pie chart"
    >
      <ResponsivePie
        data={data}
        margin={{ top: 24, right: 16, bottom: 56, left: 16 }}
        innerRadius={0.55}
        padAngle={1}
        cornerRadius={6}
        sortByValue
        activeOuterRadiusOffset={8}
        colors={{ scheme: "set2" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        arcLabelsSkipAngle={12}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.4]] }}
        arcLinkLabelsSkipAngle={12}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLinkLabelsTextColor="#3a4a42"
        animate
        motionConfig="gentle"
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 48,
            itemWidth: 56,
            itemHeight: 18,
            itemsSpacing: 4,
            symbolSize: 14,
            symbolShape: "circle",
            itemTextColor: "#64756c",
            effects: [{ on: "hover", style: { itemTextColor: "#0f1a15" } }],
          },
        ]}
      />
    </div>
  );
}
