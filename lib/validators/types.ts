// Validation output shape (BUILD_SPEC §M5). Stored in documents.validation.
// The LLM never produces these — every verdict here is deterministic TS.

export type ValidationStatus = "pass" | "warn" | "fail";

export interface ValidationResult {
  /** Dotted path of the field checked, e.g. "containers[0].container_no". */
  field: string;
  /** Rule id, e.g. "iso6346", "imo_checksum", "weights.container_sum". */
  rule: string;
  status: ValidationStatus;
  /** Human-readable, shown on the Trust Screen. */
  message: string;
  expected?: string;
  actual?: string;
}

/** Cross-document finding (BUILD_SPEC §M5.7) — maps to a discrepancies row. */
export interface Discrepancy {
  severity: "red" | "amber";
  field: string;
  doc_a: string;
  doc_b: string;
  value_a: string | null;
  value_b: string | null;
  message: string;
}
