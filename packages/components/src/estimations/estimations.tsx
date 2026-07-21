"use client";

import * as React from "react";
import { cn } from "@scrum-poker/ui";
import { FileText } from "lucide-react";
import type { Estimation } from "@scrum-poker/types";
import { EstimationPanel } from "./estimation-panel";

export interface EstimationsProps {
  /** All estimation rounds in the session. */
  estimations: Estimation[];
  /** Controlled selected round id. Falls back to internal state when omitted. */
  selectedId?: string;
  /** Notified when a round is selected in the list. */
  onSelect?: (id: string) => void;
  onStart?: (estimation: Estimation) => void;
  onStop?: (estimation: Estimation) => void;
  onDelete?: (estimation: Estimation) => void;
  className?: string;
}

/**
 * Estimations — the product-owner list of estimation rounds with a management
 * panel for the selected one (rebuilt from the legacy Semantic UI `Tab`). The
 * vertical nav lists each round with an "Active" indicator; selecting one shows
 * its {@link EstimationPanel}. Presentational + callbacks-out.
 */
export function Estimations({
  estimations,
  selectedId,
  onSelect,
  onStart,
  onStop,
  onDelete,
  className,
}: EstimationsProps) {
  const [internalId, setInternalId] = React.useState<string | undefined>(
    () => estimations.find((e) => e.isActive)?.id ?? estimations[0]?.id,
  );
  const activeId = selectedId ?? internalId;
  const selected =
    estimations.find((e) => e.id === activeId) ?? estimations[0];

  const select = (id: string) => {
    setInternalId(id);
    onSelect?.(id);
  };

  if (estimations.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface-subtle py-section text-center text-muted",
          className,
        )}
      >
        <FileText aria-hidden="true" className="size-8" />
        <p className="text-sm font-medium">No estimations yet</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-card md:grid-cols-[16rem_1fr]",
        className,
      )}
    >
      <nav aria-label="Estimations" className="flex flex-col gap-1">
        {estimations.map((estimation) => {
          const isSelected = estimation.id === selected?.id;
          return (
            <button
              key={estimation.id}
              type="button"
              onClick={() => select(estimation.id)}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-button border border-transparent px-3 py-2 text-left text-sm font-medium",
                "transition-colors duration-fast ease-emphasized motion-reduce:transition-none",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isSelected
                  ? "border-border bg-surface text-content shadow-card"
                  : "text-content-subtle hover:bg-surface-muted",
              )}
            >
              <span className="truncate">{estimation.name}</span>
              {estimation.isActive && !estimation.isEnded ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-brand-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-brand-700">
                  <span className="size-1.5 animate-pulse rounded-pill bg-brand" />
                  Active
                </span>
              ) : estimation.isEnded ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-muted">
                  Revealed
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {selected ? (
        <EstimationPanel
          estimation={selected}
          onStart={onStart}
          onStop={onStop}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
}
