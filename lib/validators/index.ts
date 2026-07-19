// Validators (BUILD_SPEC §M5) — deterministic TypeScript only, the LLM
// never produces a verdict. validateDocument() is what the parse route
// stores in documents.validation; crossCheck() feeds discrepancies (M6
// Shipment Check); duplicates() gets its candidate list from the route.

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { validateContainerNo } from "./container";
import { dates } from "./dates";
import { validateImo } from "./imo";
import type { ValidationResult } from "./types";
import { validatePort } from "./unlocode";
import { weights } from "./weights";

export { containerCheckDigit, computeCheckDigit, normalizeContainerNo, validateContainerNo } from "./container";
export { dates, parsePrintedDate, daysBetween } from "./dates";
export { duplicates, type ExistingRef } from "./duplicates";
export { imoChecksum, normalizeImo, validateImo } from "./imo";
export { levenshtein, normalizeName, normalizeText, similarity } from "./normalize";
export { crossCheck, type ShipmentDoc, INVOICE_AFTER_BL_TOLERANCE_DAYS } from "./cross-check";
export type { Discrepancy, ValidationResult, ValidationStatus } from "./types";
export { unlocode, looksLikeUnlocode, portNameForCode, validatePort, type PortMatch } from "./unlocode";
export { weights, withinTolerance, WEIGHT_TOLERANCE } from "./weights";

/**
 * All single-document rules for one parsed extraction.
 * Deterministic: same input + same `today` → same output.
 */
export function validateDocument(
  extraction: NormalizedExtraction,
  today: Date = new Date()
): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (extraction.detected_type === "bill_of_lading") {
    const f = extraction.fields;
    f.containers.forEach((c, i) => {
      if (c.container_no) {
        results.push(validateContainerNo(`containers[${i}].container_no`, c.container_no));
      }
    });
    if (f.imo_number) results.push(validateImo("imo_number", f.imo_number));
    results.push(...validatePort("port_of_load", f.port_of_load));
    results.push(...validatePort("port_of_discharge", f.port_of_discharge));
  }

  if (extraction.detected_type === "packing_list") {
    extraction.fields.container_refs.forEach((ref, i) => {
      results.push(validateContainerNo(`container_refs[${i}]`, ref));
    });
  }

  results.push(...weights(extraction));
  results.push(...dates(extraction, today));
  return results;
}
