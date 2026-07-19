// ISO 6346 container number check digit (BUILD_SPEC §M5.1).
// Letter values start at A=10 and skip multiples of 11 (so no letter maps
// to 11, 22 or 33); each of the first 10 characters is weighted 2^position;
// sum mod 11; a remainder of 10 maps to check digit 0.

import type { ValidationResult } from "./types";

/** Strip spaces/hyphens, uppercase. */
export function normalizeContainerNo(no: string): string {
  return no.toUpperCase().replace(/[\s-]+/g, "");
}

const CONTAINER_RE = /^[A-Z]{3}[UJZ]\d{7}$/;

/**
 * Expected ISO 6346 check digit for the first 10 characters
 * (4 letters + 6 serial digits), or null when the format is not
 * a container number at all.
 */
export function computeCheckDigit(no: string): number | null {
  const n = normalizeContainerNo(no);
  if (!/^[A-Z]{4}\d{6,7}$/.test(n)) return null;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = n[i];
    const v = ch >= "0" && ch <= "9" ? Number(ch) : iso6346LetterValue(ch);
    sum += v * 2 ** i;
  }
  const rem = sum % 11;
  return rem === 10 ? 0 : rem;
}

/** ISO 6346 letter → numeric value (A=10, skipping multiples of 11). */
export function iso6346LetterValue(ch: string): number {
  const idx = ch.charCodeAt(0) - 65; // A=0 .. Z=25
  let value = 10 + idx;
  if (value >= 11) value += 1; // skip 11
  if (value >= 22) value += 1; // skip 22
  if (value >= 33) value += 1; // skip 33
  return value;
}

/**
 * Spec entry point: true/false when the number carries a verifiable check
 * digit, null when the string is not a plausible container number.
 */
export function containerCheckDigit(no: string): boolean | null {
  const n = normalizeContainerNo(no);
  if (!CONTAINER_RE.test(n)) return null;
  return computeCheckDigit(n) === Number(n[10]);
}

/** ValidationResult wrapper used by validateDocument. */
export function validateContainerNo(
  field: string,
  no: string
): ValidationResult {
  const n = normalizeContainerNo(no);
  const valid = containerCheckDigit(n);
  if (valid === null) {
    return {
      field,
      rule: "iso6346",
      status: "warn",
      message: `"${no}" is not a standard container number (4 letters + 7 digits)`,
      actual: no,
    };
  }
  if (!valid) {
    const expected = computeCheckDigit(n);
    return {
      field,
      rule: "iso6346",
      status: "fail",
      message: `Check digit should be ${expected}, document shows ${n[10]} — likely a misread or typo`,
      expected: n.slice(0, 10) + String(expected),
      actual: n,
    };
  }
  return {
    field,
    rule: "iso6346",
    status: "pass",
    message: "Container number check digit is valid",
    actual: n,
  };
}
