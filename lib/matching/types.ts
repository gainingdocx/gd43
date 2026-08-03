export type MatchDecision = "matched" | "review" | "blocked" | "incomplete";
export type MatchStatus = "pass" | "fail" | "review" | "skipped";
export type MatchCategory =
  | "completeness"
  | "identity"
  | "party"
  | "route"
  | "logistics"
  | "quantity"
  | "amount"
  | "date";

export interface MatchTolerance {
  absolute?: number;
  percent?: number;
  days?: number;
  description: string;
}

export interface MatchRuleResult {
  rule_id: string;
  workflow?:
    | "export_document_check"
    | "shipment_document_check"
    | "freight_invoice_audit"
    | "arrival_free_time_control"
    | "air_export_readiness"
    | "air_consolidation_check"
    | "air_freight_invoice_audit"
    | "dangerous_goods_document_check"
    | "supporting";
  category: MatchCategory;
  status: MatchStatus;
  severity: "critical" | "warning" | "info";
  label: string;
  message: string;
  doc_a: string | null;
  doc_b: string | null;
  field_a: string | null;
  field_b: string | null;
  value_a: string | null;
  value_b: string | null;
  tolerance?: MatchTolerance;
  questioned_amount?: number;
  questioned_currency?: string | null;
}

export interface MatchRequirement {
  role: string;
  label: string;
  present: boolean;
  document_ids: string[];
}

export interface ThreeWayMatchResult {
  schema_version: "match-v1" | "match-v2";
  decision: MatchDecision;
  score: number;
  requirements: MatchRequirement[];
  counts: Record<MatchStatus, number>;
  rules: MatchRuleResult[];
  workflows?: import("@/lib/workflows/flagship").FlagshipWorkflowResult[];
  generated_at: string;
}
