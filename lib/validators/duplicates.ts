// Duplicate-document detection (BUILD_SPEC §M5.6). Pure comparison — the
// caller (parse route) queries the owner's other documents and passes the
// candidate refs in; this module never touches the database.

import { normalizeText } from "./normalize";
import type { ValidationResult } from "./types";

export interface ExistingRef {
  id: string;
  value: string | null;
}

/**
 * Spec entry point: warn when another document of the same owner already
 * carries this bl_number / invoice_no. `existing` must exclude the
 * document being validated.
 */
/** Reference numbers compare with spaces/punctuation fully removed. */
function refKey(value: string): string {
  return normalizeText(value).replace(/ /g, "");
}

export function duplicates(
  kind: "bl_number" | "invoice_no",
  value: string | null,
  existing: ExistingRef[]
): ValidationResult | null {
  if (value === null || refKey(value) === "") return null;
  const key = refKey(value);
  const hits = existing.filter(
    (e) => e.value !== null && refKey(e.value) === key
  );
  if (hits.length === 0) return null;
  return {
    field: kind,
    rule: "duplicates",
    status: "warn",
    message: `You already have ${hits.length} document${hits.length > 1 ? "s" : ""} with ${kind === "bl_number" ? "B/L number" : "invoice number"} "${value}"`,
    actual: value,
  };
}
