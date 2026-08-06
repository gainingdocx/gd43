// GET /v1/shipments/{id}/discrepancies — the findings for one shipment.
//
// Separate from the shipment resource because this is the endpoint an exception
// queue polls, and it should not have to pull every document's field data to
// ask "is anything wrong". Each finding carries both conflicting values and the
// documents they came from, so a caller can act without a second request.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { notFound, serverError } from "@/lib/api/errors";
import { pathSegment, requireEnum } from "@/lib/api/validate";
import { createAdminClient } from "@/lib/supabase/admin";

const SEVERITIES = ["red", "amber"] as const;

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../shipments/{id}/discrepancies
  const shipmentId = pathSegment(request, 1);
  const url = new URL(request.url);
  const admin = createAdminClient();

  const { data: shipment } = await admin
    .from("shipments")
    .select("id")
    .eq("id", shipmentId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (!shipment) throw notFound(`No shipment with id '${shipmentId}'.`, "shipment_not_found");

  let query = admin
    .from("discrepancies")
    .select("id, shipment_id, severity, field, message, value_a, value_b, doc_a, doc_b, category, rule_reason, questioned_amount, questioned_currency, resolved, resolution_status, resolution_note, resolved_at, created_at")
    .eq("shipment_id", shipmentId)
    .eq("owner", caller.owner)
    .order("created_at", { ascending: false });

  const severity = url.searchParams.get("severity");
  if (severity) query = query.eq("severity", requireEnum(severity, "severity", SEVERITIES));
  const resolved = url.searchParams.get("resolved");
  if (resolved !== null) query = query.eq("resolved", resolved === "true");

  const { data, error } = await query;
  if (error) throw serverError("Discrepancies could not be listed.");

  const rows = data ?? [];
  return json(
    list(
      rows.map((row) => ({
        id: row.id,
        object: "discrepancy" as const,
        shipment_id: row.shipment_id,
        severity: row.severity,
        field: row.field,
        message: row.message,
        // Named `_a` / `_b` to match the document pair they came from, not
        // "expected"/"actual" — neither document is authoritative, which is the
        // entire reason a person has to look.
        value_a: row.value_a,
        value_b: row.value_b,
        document_a: row.doc_a,
        document_b: row.doc_b,
        category: row.category,
        rule_reason: row.rule_reason,
        questioned_amount: row.questioned_amount,
        questioned_currency: row.questioned_currency,
        resolved: row.resolved,
        resolution_status: row.resolution_status,
        resolution_note: row.resolution_note,
        resolved_at: row.resolved_at,
        created_at: row.created_at,
      })),
      { total: rows.length }
    ),
    { id, headers: rateHeaders(caller) }
  );
});
