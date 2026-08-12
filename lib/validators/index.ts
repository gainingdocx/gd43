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
import { financials } from "./financial";
import { validateDangerousGoods } from "./dangerous-goods";
import { validateAirCargoDocument } from "./air-cargo";
import { extractionSafety } from "./extraction-safety";

export { containerCheckDigit, computeCheckDigit, normalizeContainerNo, validateContainerNo } from "./container";
export { dates, parsePrintedDate, daysBetween } from "./dates";
export { duplicates, type ExistingRef } from "./duplicates";
export { imoChecksum, normalizeImo, validateImo } from "./imo";
export { levenshtein, normalizeName, normalizeText, similarity } from "./normalize";
export { crossCheck, type ShipmentDoc, INVOICE_AFTER_BL_TOLERANCE_DAYS } from "./cross-check";
export type { Discrepancy, ValidationResult, ValidationStatus } from "./types";
export { unlocode, looksLikeUnlocode, portNameForCode, validatePort, type PortMatch } from "./unlocode";
export { weights, withinTolerance, WEIGHT_TOLERANCE } from "./weights";
export { financials } from "./financial";
export { awbCheckDigit, normalizeAwbNumber, validateAwbNumber } from "./air-waybill";
export { validateAirCargoDocument, validateIataAirportCode } from "./air-cargo";
export { dangerousGoodsOf, normalizeUnNumber, supportsDangerousGoods, validateDangerousGoods } from "./dangerous-goods";
export { extractionSafety } from "./extraction-safety";

/**
 * All single-document rules for one parsed extraction.
 * Deterministic: same input + same `today` → same output.
 */
export function validateDocument(
  extraction: NormalizedExtraction,
  today: Date = new Date()
): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill") {
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

  if (extraction.detected_type === "arrival_notice") {
    const f = extraction.fields;
    f.containers.forEach((c, i) => {
      if (c.container_no) results.push(validateContainerNo(`containers[${i}].container_no`, c.container_no));
    });
    results.push(...validatePort("port_of_discharge", f.port_of_discharge));
    const charges = [f.freight_due, f.terminal_charges, f.other_charges].filter((v): v is number => typeof v === "number");
    if (f.total_charges !== null && charges.length > 0) {
      const calculated = charges.reduce((a, b) => a + b, 0);
      results.push({ field: "total_charges", rule: "charge_sum", status: Math.abs(calculated - f.total_charges) <= .01 ? "pass" : "fail", message: Math.abs(calculated - f.total_charges) <= .01 ? "Printed charge total matches its components" : `Charge components total ${calculated}, but the notice prints ${f.total_charges}`, expected: String(calculated), actual: String(f.total_charges) });
    }
  }

  if (extraction.detected_type === "booking_confirmation") {
    const f = extraction.fields;
    f.equipment.forEach((c, i) => {
      if (c.container_no) results.push(validateContainerNo(`equipment[${i}].container_no`, c.container_no));
    });
    results.push(...validatePort("port_of_load", f.port_of_load));
    results.push(...validatePort("port_of_discharge", f.port_of_discharge));
  }

  if (extraction.detected_type === "shipping_instructions") {
    const f = extraction.fields;
    f.containers.forEach((c, i) => {
      if (c.container_no) results.push(validateContainerNo(`containers[${i}].container_no`, c.container_no));
    });
    results.push(...validatePort("port_of_load", f.port_of_load));
    results.push(...validatePort("port_of_discharge", f.port_of_discharge));
  }

  if (extraction.detected_type === "quotation" || extraction.detected_type === "rate_confirmation") {
    results.push(...validatePort("port_of_load", extraction.fields.port_of_load));
    results.push(...validatePort("port_of_discharge", extraction.fields.port_of_discharge));
  }

  if (extraction.detected_type === "container_event") {
    if (extraction.fields.container_no) results.push(validateContainerNo("container_no", extraction.fields.container_no));
    results.push(...validatePort("port", extraction.fields.port));
  }

  if (extraction.detected_type === "packing_list") {
    extraction.fields.container_refs.forEach((ref, i) => {
      results.push(validateContainerNo(`container_refs[${i}]`, ref));
    });
  }

  results.push(...weights(extraction));
  results.push(...financials(extraction));
  results.push(...dates(extraction, today));
  results.push(...validateDangerousGoods(extraction));
  results.push(...validateAirCargoDocument(extraction));
  results.push(...extractionSafety(extraction));
  return results;
}
