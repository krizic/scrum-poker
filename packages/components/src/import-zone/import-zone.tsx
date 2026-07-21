"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileWarning } from "lucide-react";
import { cn } from "@scrum-poker/ui";
import {
  parseEstimationsCsv,
  CsvImportError,
  type ImportedEstimation,
} from "@scrum-poker/utils";

export interface ImportZoneProps {
  /** Called with the parsed estimations once a CSV is dropped/selected. */
  onImport: (estimations: ImportedEstimation[]) => void;
  /** Called with a human-readable message when parsing fails. */
  onError?: (message: string) => void;
  className?: string;
}

/**
 * ImportZone — drag-and-drop CSV import (react-dropzone). The dropped file is
 * read client-side and parsed with `parseEstimationsCsv` from
 * `@scrum-poker/utils`; the parsed estimations are emitted via `onImport`. The
 * component performs no persistence — the route decides what to do with them.
 */
export function ImportZone({ onImport, onError, className }: ImportZoneProps) {
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError(null);
      try {
        const text = await file.text();
        onImport(parseEstimationsCsv(text));
      } catch (err) {
        const message =
          err instanceof CsvImportError
            ? err.message
            : "Could not read the CSV file.";
        setError(message);
        onError?.(message);
      }
    },
    [onImport, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".csv"] },
    multiple: false,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Import estimations from a CSV file"
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-section text-center",
          "transition-colors duration-fast ease-emphasized motion-reduce:transition-none",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          isDragActive
            ? "border-brand bg-brand-50"
            : "border-border bg-surface-subtle hover:border-border-strong hover:bg-surface-muted",
        )}
      >
        <input {...getInputProps()} />
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-pill bg-surface-muted text-muted [&_svg]:size-6",
            isDragActive && "bg-brand text-brand-foreground",
          )}
        >
          <UploadCloud aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-content">
          Import from CSV file
        </span>
        <span className="text-sm text-muted">
          {isDragActive
            ? "Drop the file here …"
            : "Drag & drop a CSV file here, or click to select one"}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-2 flex items-center gap-2 rounded-button bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700"
        >
          <FileWarning aria-hidden="true" className="size-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
