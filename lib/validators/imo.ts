// IMO ship identification number checksum (BUILD_SPEC §M5.2).
// 7 digits; sum of the first six digits × weights 7..2; the sum's last
// digit must equal the 7th digit. Example: 9074729 → 9·7+0·6+7·5+4·4+7·3+2·2
// = 139 → last digit 9 ✓.

import type { ValidationResult } from "./types";

/** Strip an "IMO" prefix, spaces and hyphens. */
export function normalizeImo(imo: string): string {
  return imo.toUpperCase().replace(/^IMO[\s.:#-]*/i, "").replace(/[\s-]+/g, "");
}

/**
 * Spec entry point: true/false when the value is 7 digits, null when it is
 * not an IMO-number shape at all.
 */
export function imoChecksum(imo: string): boolean | null {
  const n = normalizeImo(imo);
  if (!/^\d{7}$/.test(n)) return null;
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += Number(n[i]) * (7 - i);
  return sum % 10 === Number(n[6]);
}

/** ValidationResult wrapper used by validateDocument. */
export function validateImo(field: string, imo: string): ValidationResult {
  const valid = imoChecksum(imo);
  if (valid === null) {
    return {
      field,
      rule: "imo_checksum",
      status: "warn",
      message: `"${imo}" is not a 7-digit IMO number`,
      actual: imo,
    };
  }
  if (!valid) {
    return {
      field,
      rule: "imo_checksum",
      status: "fail",
      message: "IMO number fails its checksum — likely a misread or typo",
      actual: normalizeImo(imo),
    };
  }
  return {
    field,
    rule: "imo_checksum",
    status: "pass",
    message: "IMO number checksum is valid",
    actual: normalizeImo(imo),
  };
}
