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
}

export interface MatchRequirement {
  role: "purchase_order" | "transport_evidence" | "invoice";
  label: string;
  present: boolean;
  document_ids: string[];
}

export interface ThreeWayMatchResult {
  schema_version: "match-v1";
  decision: MatchDecision;
  score: number;
  requirements: MatchRequirement[];
  counts: Record<MatchStatus, number>;
  rules: MatchRuleResult[];
  generated_at: string;
}
