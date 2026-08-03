import type { LineItem, NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { validateAwbNumber } from "./air-waybill";
import type { ValidationResult } from "./types";

function result(
  field: string,
  rule: string,
  status: ValidationResult["status"],
  message: string,
  actual?: string,
  expected?: string,
): ValidationResult {
  return { field, rule, status, message, actual, expected };
}

export function validateIataAirportCode(field: string, value: string): ValidationResult {
  const normalized = value.trim().toUpperCase();
  const valid = /^[A-Z]{3}$/.test(normalized);
  return result(
    field,
    "iata_airport_code_format",
    valid ? "pass" : "fail",
    valid ? `${normalized} has a valid three-letter IATA location-code format` : "Airport code must contain exactly three letters",
    value,
    "Three letters, for example DEL or FRA",
  );
}

function validatePrintedAwb(field: string, value: string): ValidationResult[] {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? [validateAwbNumber(field, value)] : [];
}

function completeSum(lines: LineItem[], selector: (line: LineItem) => number | null | undefined): number | null {
  if (!lines.length) return null;
  const values = lines.map(selector);
  if (values.some((value) => typeof value !== "number")) return null;
  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

function compareTotal(field: string, label: string, printed: number | null, calculated: number | null): ValidationResult | null {
  if (printed === null || calculated === null) return null;
  const tolerance = Math.max(0.01, Math.abs(printed) * 0.005);
  const same = Math.abs(printed - calculated) <= tolerance;
  return result(
    field,
    `air_cargo.${field}_sum`,
    same ? "pass" : "fail",
    same ? `${label} matches the sum of the air-cargo lines` : `${label} is ${printed}, but the extracted lines total ${calculated}`,
    String(printed),
    String(calculated),
  );
}

export function validateAirCargoDocument(extraction: NormalizedExtraction): ValidationResult[] {
  const results: ValidationResult[] = [];
  const fields = extraction.fields as unknown as Record<string, unknown>;
  const airport = (key: "origin_airport" | "destination_airport") => {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) results.push(validateIataAirportCode(key, value));
  };
  const awbList = (key: "awb_numbers") => {
    const values = fields[key];
    if (Array.isArray(values)) values.forEach((value, index) => {
      if (typeof value === "string") results.push(...validatePrintedAwb(`${key}[${index}]`, value));
    });
  };

  if (["air_waybill", "shipper_letter_of_instruction", "dangerous_goods_declaration", "air_cargo_manifest"].includes(extraction.detected_type)) {
    airport("origin_airport");
    airport("destination_airport");
  }

  if (extraction.detected_type === "air_waybill") {
    const f = extraction.fields;
    if (f.awb_number && f.awb_type !== "house") results.push(...validatePrintedAwb("awb_number", f.awb_number));
    if (f.master_awb_number) results.push(...validatePrintedAwb("master_awb_number", f.master_awb_number));

    const printedPrefix = f.airline_prefix?.replace(/\D/g, "");
    const awbPrefix = f.awb_number?.replace(/\D/g, "").slice(0, 3);
    if (printedPrefix && awbPrefix) {
      const same = printedPrefix === awbPrefix;
      results.push(result(
        "airline_prefix",
        "air_cargo.airline_prefix_consistency",
        same ? "pass" : "fail",
        same ? "Printed airline prefix matches the AWB number" : `Airline prefix ${printedPrefix} does not match AWB prefix ${awbPrefix}`,
        printedPrefix,
        awbPrefix,
      ));
    }

    if (typeof f.total_gross_kg === "number" && typeof f.total_chargeable_kg === "number") {
      const valid = f.total_chargeable_kg >= f.total_gross_kg;
      results.push(result(
        "total_chargeable_kg",
        "air_cargo.chargeable_not_below_gross",
        valid ? "pass" : "fail",
        valid ? "Chargeable weight is not below actual gross weight" : "Chargeable weight is below actual gross weight; verify dimensions, rating basis and transcription",
        String(f.total_chargeable_kg),
        `At least ${f.total_gross_kg}`,
      ));
    }

    for (const item of [
      compareTotal("total_pieces", "Printed piece total", f.total_pieces, completeSum(f.line_items, (line) => line.packages ?? line.quantity)),
      compareTotal("total_gross_kg", "Printed gross weight", f.total_gross_kg, completeSum(f.line_items, (line) => line.gross_kg)),
      compareTotal("total_chargeable_kg", "Printed chargeable weight", f.total_chargeable_kg, completeSum(f.line_items, (line) => line.chargeable_kg)),
    ]) if (item) results.push(item);
  }

  if (["shipper_letter_of_instruction", "dangerous_goods_declaration", "air_cargo_manifest", "cargo_security_declaration"].includes(extraction.detected_type)) {
    awbList("awb_numbers");
  }

  if (extraction.detected_type === "dangerous_goods_declaration") {
    const f = extraction.fields;
    results.push(result(
      "dangerous_goods",
      "air_cargo.dgd_items_present",
      f.dangerous_goods.length ? "pass" : "warn",
      f.dangerous_goods.length ? "Dangerous-goods entries were extracted for review" : "No dangerous-goods entries were extracted from this declaration",
    ));
    for (const [field, value, label] of [
      ["signatory_name", f.signatory_name, "signatory name"],
      ["signed_date", f.signed_date, "signed date"],
    ] as const) results.push(result(
      field,
      `air_cargo.dgd_${field}_present`,
      value ? "pass" : "warn",
      value ? `A ${label} is printed for human review` : `No ${label} was extracted; verify the source declaration`,
      value ?? "",
    ));
  }

  if (extraction.detected_type === "cargo_security_declaration") {
    const f = extraction.fields;
    for (const [field, value, label] of [
      ["security_status", f.security_status, "security status"],
      ["regulated_agent", f.regulated_agent?.name, "regulated agent"],
      ["issued_by", f.issued_by, "issuer"],
      ["issue_date", f.issue_date, "issue date"],
    ] as const) results.push(result(
      field,
      `air_cargo.security_${field}_present`,
      value ? "pass" : "warn",
      value ? `A ${label} is printed for review` : `No ${label} was extracted; verify the security declaration`,
      value ?? "",
    ));
  }

  return results;
}
