// Date plausibility rules (BUILD_SPEC §M5.5). Extraction stores dates
// exactly as printed ("12 MAR 2026", "2026-03-12", "12/03/2026"), so this
// module first parses tolerantly; unparseable dates get a warn, never a
// fail. Cross-document date rules (invoice vs B/L) live in cross-check.ts.

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import type { ValidationResult } from "./types";

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DAY_MS = 86_400_000;

function utc(y: number, m: number, d: number): Date | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  // reject rollovers like 31 FEB
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}

function fullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

/**
 * Parse a date string as printed on shipping documents. Returns null when
 * unrecognized. Ambiguous all-numeric dates (03/04/2026) are read
 * day-first — the dominant convention on international shipping docs.
 */
export function parsePrintedDate(s: string): Date | null {
  const t = s.trim().toUpperCase().replace(/(\d)(ST|ND|RD|TH)\b/g, "$1");

  // ISO: 2026-03-12 (also 2026/03/12, 2026.03.12)
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return utc(Number(m[1]), Number(m[2]), Number(m[3]));

  // 12 MAR 2026 / 12-MAR-26 / 12 MARCH 2026
  m = t.match(/^(\d{1,2})[\s\-/.]*([A-Z]{3,9})[\s\-/.,]*(\d{2,4})$/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3)] ?? MONTHS[m[2].slice(0, 4)];
    if (mon) return utc(fullYear(Number(m[3])), mon, Number(m[1]));
  }

  // MAR 12, 2026 / MARCH 12 2026
  m = t.match(/^([A-Z]{3,9})[\s\-/.]*(\d{1,2})[\s\-/.,]*(\d{2,4})$/);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3)] ?? MONTHS[m[1].slice(0, 4)];
    if (mon) return utc(fullYear(Number(m[3])), mon, Number(m[2]));
  }

  // All-numeric: 12/03/2026, 12-03-26, 12.03.2026 — day-first; falls back
  // to month-first only when day-first is impossible (03/28/2026).
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), fullYear(Number(m[3]))];
    return utc(y, b, a) ?? utc(y, a, b);
  }

  return null;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Spec entry point: date rules for one parsed document. */
export function dates(
  extraction: NormalizedExtraction,
  today: Date = new Date()
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const check = (field: string, value: string | null): Date | null => {
    if (value === null) return null;
    const parsed = parsePrintedDate(value);
    if (!parsed) {
      results.push({
        field,
        rule: "dates.format",
        status: "warn",
        message: `Could not read "${value}" as a date`,
        actual: value,
      });
    }
    return parsed;
  };

  if (extraction.detected_type === "bill_of_lading") {
    const f = extraction.fields;
    const sob = check("shipped_on_board_date", f.shipped_on_board_date);
    const issue = check("issue_date", f.issue_date);

    if (sob) {
      // shipped_on_board ≥ issue − 30d and ≤ today + 2d
      if (issue && daysBetween(sob, issue) > 30) {
        results.push({
          field: "shipped_on_board_date",
          rule: "dates.sob_vs_issue",
          status: "fail",
          message: `Shipped-on-board date is more than 30 days before the issue date (${f.issue_date})`,
          expected: `within 30 days of ${f.issue_date}`,
          actual: f.shipped_on_board_date!,
        });
      } else if (issue) {
        results.push({
          field: "shipped_on_board_date",
          rule: "dates.sob_vs_issue",
          status: "pass",
          message: "Shipped-on-board date is consistent with the issue date",
          actual: f.shipped_on_board_date!,
        });
      }
      if (daysBetween(today, sob) > 2) {
        results.push({
          field: "shipped_on_board_date",
          rule: "dates.sob_future",
          status: "fail",
          message: `Shipped-on-board date ${f.shipped_on_board_date} is in the future`,
          expected: `on or before ${today.toISOString().slice(0, 10)} (+2d)`,
          actual: f.shipped_on_board_date!,
        });
      }
    }
  }

  if (extraction.detected_type === "commercial_invoice") {
    const inv = check("invoice_date", extraction.fields.invoice_date);
    if (inv && daysBetween(today, inv) > 2) {
      results.push({
        field: "invoice_date",
        rule: "dates.invoice_future",
        status: "warn",
        message: `Invoice date ${extraction.fields.invoice_date} is in the future`,
        actual: extraction.fields.invoice_date!,
      });
    }
  }

  if (extraction.detected_type === "packing_list") {
    check("date", extraction.fields.date);
  }

  return results;
}
