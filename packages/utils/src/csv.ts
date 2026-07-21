import Papa from "papaparse";

/**
 * CSV import/export helpers, ported from the legacy PO page
 * (`src/pages/po-page.tsx` `importEstimationsFromFile`) which used papaparse to
 * turn a Jira-style export into estimations.
 *
 * Kept pure: functions take a CSV *string* in and return typed objects, so they
 * are trivially testable and reusable on both server and client. Id generation
 * and persistence stay with the caller.
 */

/** Column headers the importer recognizes (matches the legacy Jira export). */
export const ISSUE_KEY_HEADER = "Issue key";
export const DESCRIPTION_HEADER = "Description";

/**
 * A row parsed from CSV, ready to become an `Estimation`. Only the fields a CSV
 * import can supply are present; the caller assigns `id`/`sessionId`/etc.
 */
export interface ImportedEstimation {
  /** From the "Issue key" column. */
  name: string;
  /** From the "Description" column. */
  description: string;
}

/** Thrown when the CSV is structurally unusable (parse errors, missing header). */
export class CsvImportError extends Error {
  public override readonly name = "CsvImportError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Parse a Jira-style CSV export into estimations. Requires an "Issue key"
 * column; a "Description" column is optional (missing values become "").
 *
 * @throws {CsvImportError} on parse errors or when the required header is absent.
 */
export function parseEstimationsCsv(csv: string): ImportedEstimation[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new CsvImportError(
      `Failed to parse CSV: ${first?.message ?? "unknown error"}`,
    );
  }

  const headers = result.meta.fields ?? [];
  if (!headers.includes(ISSUE_KEY_HEADER)) {
    throw new CsvImportError(
      `Missing required "${ISSUE_KEY_HEADER}" column in CSV header.`,
    );
  }

  return result.data.map((row) => ({
    name: (row[ISSUE_KEY_HEADER] ?? "").trim(),
    description: (row[DESCRIPTION_HEADER] ?? "").trim(),
  }));
}

/**
 * Serialize estimations back to a CSV string using the same header contract as
 * {@link parseEstimationsCsv}, enabling a lossless import → export round-trip.
 */
export function formatEstimationsToCsv(
  estimations: readonly ImportedEstimation[],
): string {
  return Papa.unparse(
    {
      fields: [ISSUE_KEY_HEADER, DESCRIPTION_HEADER],
      data: estimations.map((estimation) => [
        estimation.name,
        estimation.description,
      ]),
    },
    { newline: "\n" },
  );
}
