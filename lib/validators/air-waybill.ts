import type { ValidationResult } from "./types";

export function normalizeAwbNumber(value: string): string {
  return value.toUpperCase().replace(/[^0-9]/g, "");
}

export function awbCheckDigit(value: string): number | null {
  const normalized = normalizeAwbNumber(value);
  if (!/^\d{11}$/.test(normalized)) return null;
  return Number(normalized.slice(3, 10)) % 7;
}

export function validateAwbNumber(field: string, value: string): ValidationResult {
  const normalized = normalizeAwbNumber(value);
  if (!/^\d{11}$/.test(normalized)) {
    return { field, rule: "iata_awb_mod7", status: "fail", message: "AWB number must contain a 3-digit airline prefix, 7-digit serial and check digit", actual: value };
  }
  const expected = awbCheckDigit(normalized)!;
  const actual = Number(normalized.at(-1));
  return expected === actual
    ? { field, rule: "iata_awb_mod7", status: "pass", message: "AWB serial and modulus-7 check digit are consistent", expected: String(expected), actual: String(actual) }
    : { field, rule: "iata_awb_mod7", status: "fail", message: `AWB check digit should be ${expected}, not ${actual}`, expected: String(expected), actual: String(actual) };
}
