import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import type { ValidationResult } from "./types";

const CRITICAL_TOTALS = [
  "total_packages", "total_pieces", "total_cartons", "total_shipments",
  "total_net_kg", "total_gross_kg", "total_chargeable_kg", "total_volume_cbm",
  "subtotal", "total_amount", "amount_due",
] as const;

function close(a: number, b: number) {
  const base = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / base <= .005;
}

function numbersIn(value: string) {
  return (value.match(/[-+]?\d[\d,.]*(?:\.\d+)?/g) ?? [])
    .map((token) => Number(token.replace(/,/g, "")))
    .filter(Number.isFinite);
}

/**
 * Safety checks for contradictions introduced by extraction itself. These are
 * deliberately failures, not soft confidence hints: a reviewer must resolve
 * them before approval or consolidated export.
 */
export function extractionSafety(extraction: NormalizedExtraction): ValidationResult[] {
  const fields = extraction.fields as unknown as Record<string, unknown>;
  const meta = extraction.fields._meta;
  const results: ValidationResult[] = [];

  if (extraction.detected_type === "bill_of_lading" && typeof fields.bl_number === "string") {
    const normalized = fields.bl_number.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length < 5 || /^\d+$/.test(normalized)) {
      results.push({
        field: "bl_number",
        rule: "extraction.bl_number_shape",
        status: "fail",
        message: `The extracted B/L number “${fields.bl_number}” is not a credible transport-document identifier; verify the printed B/L field.`,
        actual: fields.bl_number,
      });
    }
  }

  for (const flag of meta.confidence_flags) {
    if (flag.startsWith("low_quality:")) {
      const score = flag.slice("low_quality:".length);
      results.push({
        field: "_meta.quality_score",
        rule: "extraction.low_quality",
        status: "fail",
        message: `The extraction quality score ${score} is below the release threshold; review the source fields before approval.`,
        actual: score,
      });
      continue;
    }
    if (!flag.startsWith("cross_model:")) continue;
    const field = flag.slice("cross_model:".length);
    results.push({
      field,
      rule: "extraction.cross_model_conflict",
      status: "fail",
      message: `Two Gemma extraction passes returned different values for ${field}; verify the highlighted source before approval.`,
      actual: String(fields[field] ?? "unresolved"),
    });
  }

  const evidence = meta.source_evidence ?? {};
  for (const field of CRITICAL_TOTALS) {
    const value = fields[field];
    const quote = evidence[field]?.quote;
    if (typeof value !== "number" || !quote) continue;
    const printed = numbersIn(quote);
    if (printed.length === 0) continue;
    const supported = printed.some((candidate) => close(candidate, value));
    results.push({
      field,
      rule: "extraction.numeric_evidence",
      status: supported ? "pass" : "fail",
      message: supported
        ? `Extracted ${field.replace(/_/g, " ")} is present in its source evidence.`
        : `Extracted ${field.replace(/_/g, " ")} ${value} conflicts with the quoted source evidence “${quote.slice(0, 120)}”.`,
      expected: supported ? String(value) : printed.join(", "),
      actual: String(value),
    });
  }

  const total = typeof fields.total_packages === "number" ? fields.total_packages : null;
  const lineSource = Array.isArray(fields.cargo)
    ? fields.cargo
    : Array.isArray(fields.line_items) ? fields.line_items : [];
  const lineCounts = lineSource.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const count = typeof row.packages === "number" ? row.packages
      : typeof row.cartons === "number" ? row.cartons : null;
    return count === null ? [] : [count];
  });
  if (total !== null && lineCounts.length >= 1) {
    const sum = lineCounts.reduce((a, b) => a + b, 0);
    results.push({
      field: "total_packages",
      rule: "packages.line_sum",
      status: sum === total ? "pass" : "fail",
      message: sum === total
        ? `Cargo-line package counts add up (${sum}).`
        : `Cargo-line package counts add to ${sum}, but the document total is ${total}. This may be a duplicated parent total or a misread line.`,
      expected: String(total),
      actual: String(sum),
    });
  }

  return results;
}
