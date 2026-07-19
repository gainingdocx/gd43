// Weight consistency rules (BUILD_SPEC §M5.4). Single-document only —
// CI-vs-PL total comparison lives in cross-check.ts because it needs both
// documents. All tolerances are relative (±0.5%).

import type { LineItem, NormalizedExtraction } from "@/lib/ai/schemas/shared";
import type { ValidationResult } from "./types";

export const WEIGHT_TOLERANCE = 0.005;

export function withinTolerance(
  a: number,
  b: number,
  tolerance = WEIGHT_TOLERANCE
): boolean {
  if (a === b) return true;
  const base = Math.max(Math.abs(a), Math.abs(b));
  return base === 0 ? true : Math.abs(a - b) / base <= tolerance;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 3 });

function sumVsTotal(
  field: string,
  rule: string,
  parts: (number | null)[],
  total: number | null,
  label: string,
  mismatchStatus: "fail" | "warn"
): ValidationResult | null {
  const present = parts.filter((p): p is number => p !== null);
  if (present.length === 0 || total === null) return null;
  const sum = present.reduce((a, b) => a + b, 0);
  if (withinTolerance(sum, total)) {
    return {
      field,
      rule,
      status: "pass",
      message: `${label} adds up (${fmt(sum)} vs total ${fmt(total)})`,
      expected: fmt(total),
      actual: fmt(sum),
    };
  }
  return {
    field,
    rule,
    status: mismatchStatus,
    message: `${label}: parts sum to ${fmt(sum)} but the document total is ${fmt(total)} (±0.5% tolerance)`,
    expected: fmt(total),
    actual: fmt(sum),
  };
}

function grossVsNetLine(
  fieldPrefix: string,
  items: LineItem[]
): ValidationResult[] {
  const out: ValidationResult[] = [];
  items.forEach((item, i) => {
    if (item.gross_kg !== null && item.net_kg !== null) {
      if (item.gross_kg < item.net_kg && !withinTolerance(item.gross_kg, item.net_kg)) {
        out.push({
          field: `${fieldPrefix}[${i}].gross_kg`,
          rule: "weights.gross_ge_net",
          status: "fail",
          message: `Line ${i + 1}: gross ${fmt(item.gross_kg)} kg is less than net ${fmt(item.net_kg)} kg`,
          expected: `≥ ${fmt(item.net_kg)}`,
          actual: fmt(item.gross_kg),
        });
      }
    }
  });
  return out;
}

/** Spec entry point: weight rules for one parsed document. */
export function weights(extraction: NormalizedExtraction): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (extraction.detected_type === "bill_of_lading") {
    const f = extraction.fields;
    const sum = sumVsTotal(
      "total_gross_kg",
      "weights.container_sum",
      f.containers.map((c) => c.gross_kg),
      f.total_gross_kg,
      "Container gross weights",
      "fail"
    );
    if (sum) results.push(sum);
    results.push(...grossVsNetLine("cargo", f.cargo));
  }

  if (extraction.detected_type === "commercial_invoice") {
    results.push(...grossVsNetLine("line_items", extraction.fields.line_items));
  }

  if (extraction.detected_type === "packing_list") {
    const f = extraction.fields;
    results.push(...grossVsNetLine("line_items", f.line_items));
    const gross = sumVsTotal(
      "total_gross_kg",
      "weights.line_sum",
      f.line_items.map((l) => l.gross_kg),
      f.total_gross_kg,
      "Line gross weights",
      "warn"
    );
    if (gross) results.push(gross);
    const net = sumVsTotal(
      "total_net_kg",
      "weights.line_sum",
      f.line_items.map((l) => l.net_kg),
      f.total_net_kg,
      "Line net weights",
      "warn"
    );
    if (net) results.push(net);
    if (
      f.total_gross_kg !== null &&
      f.total_net_kg !== null &&
      f.total_gross_kg < f.total_net_kg &&
      !withinTolerance(f.total_gross_kg, f.total_net_kg)
    ) {
      results.push({
        field: "total_gross_kg",
        rule: "weights.gross_ge_net",
        status: "fail",
        message: `Total gross ${fmt(f.total_gross_kg)} kg is less than total net ${fmt(f.total_net_kg)} kg`,
        expected: `≥ ${fmt(f.total_net_kg)}`,
        actual: fmt(f.total_gross_kg),
      });
    }
  }

  return results;
}
