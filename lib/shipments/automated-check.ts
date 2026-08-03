import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { DEFAULT_MATCH_POLICY, matchFindings, runThreeWayMatch } from "@/lib/matching";
import type { ShipmentDoc } from "@/lib/validators";

export async function runAutomatedShipmentCheck(supabase: SupabaseClient, ownerId: string, shipmentId: string) {
  const { data: docs } = await supabase.from("documents").select("id, doc_type, fields")
    .eq("shipment_id", shipmentId).eq("status", "parsed");
  const shipmentDocs: ShipmentDoc[] = (docs ?? []).filter((doc) => doc.fields && doc.doc_type !== "other").map((doc) => ({
    id: doc.id as string,
    extraction: { detected_type: doc.doc_type, fields: doc.fields } as NormalizedExtraction,
  }));
  const result = runThreeWayMatch(shipmentDocs, DEFAULT_MATCH_POLICY);
  const findings = matchFindings(result);
  const documentsById = new Map(shipmentDocs.map((document) => [document.id, document]));
  const rulesById = new Map(result.rules.map((rule) => [rule.rule_id, rule]));
  const evidenceFor = (documentId: string | null, path: string | null) => {
    if (!documentId || !path) return null;
    const fields = documentsById.get(documentId)?.extraction.fields;
    const top = path.replace(/^fields\./, "").split(".")[0].split("[")[0];
    const evidence = fields?._meta?.source_evidence?.[path] ?? fields?._meta?.source_evidence?.[top];
    const page = evidence?.page ?? fields?._meta?.page_refs?.[top] ?? null;
    return page ? { page, quote: evidence?.quote ?? null, bbox: evidence?.bbox ?? null, field_path: path } : null;
  };

  await supabase.from("discrepancies").delete().eq("shipment_id", shipmentId).eq("resolved", false);
  if (findings.length) {
    const { error } = await supabase.from("discrepancies").insert(findings.map((finding) => {
      const rule = rulesById.get(finding.field);
      return {
        shipment_id: shipmentId, owner: ownerId, severity: finding.severity, field: finding.field,
        doc_a: finding.doc_a, doc_b: finding.doc_b, value_a: finding.value_a, value_b: finding.value_b,
        message: finding.message, category: finding.category, tolerance: finding.tolerance,
        workflow_key: finding.workflow, rule_reason: finding.rule_reason,
        questioned_amount: finding.questioned_amount, questioned_currency: finding.questioned_currency,
        source_evidence: { a: evidenceFor(finding.doc_a, rule?.field_a ?? null), b: evidenceFor(finding.doc_b, rule?.field_b ?? null) },
      };
    }));
    if (error) throw error;
  }
  await Promise.all([
    supabase.from("match_runs").insert({ shipment_id: shipmentId, owner: ownerId, schema_version: result.schema_version, decision: result.decision, score: result.score, policy: DEFAULT_MATCH_POLICY, result }),
    supabase.from("events").insert({ owner: ownerId, type: "check_run", payload: { shipment_id: shipmentId, docs: shipmentDocs.length, findings: findings.length, decision: result.decision, score: result.score, policy: DEFAULT_MATCH_POLICY, source: "email" } }),
  ]);
  return { result, findings };
}
