import { describe, expect, it } from "vitest";
import {
  CsvImportError,
  formatEstimationsToCsv,
  parseEstimationsCsv,
  type ImportedEstimation,
} from "./csv";

const HEADER = "Issue key,Description";

describe("parseEstimationsCsv — happy path", () => {
  it("parses a Jira-style export into estimations", () => {
    const csv = [
      HEADER,
      "PROJ-1,Add login page",
      "PROJ-2,Refactor API client",
    ].join("\n");

    expect(parseEstimationsCsv(csv)).toEqual([
      { name: "PROJ-1", description: "Add login page" },
      { name: "PROJ-2", description: "Refactor API client" },
    ]);
  });

  it("tolerates a missing Description column value", () => {
    const csv = [HEADER, "PROJ-3,"].join("\n");
    expect(parseEstimationsCsv(csv)).toEqual([
      { name: "PROJ-3", description: "" },
    ]);
  });

  it("skips trailing empty lines", () => {
    const csv = `${HEADER}\nPROJ-4,Ship it\n\n`;
    expect(parseEstimationsCsv(csv)).toEqual([
      { name: "PROJ-4", description: "Ship it" },
    ]);
  });
});

describe("parseEstimationsCsv — malformed input", () => {
  it("throws when the required 'Issue key' header is missing", () => {
    const csv = ["Summary,Notes", "PROJ-5,whatever"].join("\n");
    expect(() => parseEstimationsCsv(csv)).toThrow(CsvImportError);
    expect(() => parseEstimationsCsv(csv)).toThrow(/Issue key/);
  });
});

describe("formatEstimationsToCsv + round-trip", () => {
  it("serializes estimations with the shared header contract", () => {
    const estimations: ImportedEstimation[] = [
      { name: "PROJ-1", description: "Add login page" },
    ];
    expect(formatEstimationsToCsv(estimations)).toBe(
      `${HEADER}\nPROJ-1,Add login page`,
    );
  });

  it("round-trips parse -> format -> parse losslessly", () => {
    const original: ImportedEstimation[] = [
      { name: "PROJ-1", description: "Add login page" },
      { name: "PROJ-2", description: "Comma, inside quotes" },
    ];
    const csv = formatEstimationsToCsv(original);
    expect(parseEstimationsCsv(csv)).toEqual(original);
  });
});
