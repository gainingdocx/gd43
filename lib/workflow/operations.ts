// The workflow operations, in one place.
//
// Approve, correct, resolve and match are each reachable two ways — a reviewer
// clicking in the workspace, and an integration calling the API — and both must
// behave identically. Two implementations would drift, and the one that drifts
// is always the one that forgets to emit the event, which is exactly the bug
// this module was written to fix: nine of the seventeen published event types
// had no emitter anywhere in the codebase.
//
// Every function here is ownership-scoped and returns null when the row does
// not belong to the caller, so a route can turn that into a 404 without
// confirming the id exists somewhere else.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { runAutomatedShipmentCheck } from "@/lib/shipments/automated-check";
import { emitWebhook } from "@/lib/integrations/webhooks";

type Admin = ReturnType<typeof createAdminClient>;

export interface DocumentSummary {
  id: string;
  shipment_id: string | null;
  doc_type: string;
  status: string;
  approved_at: string | null;
  corrected_fields: string[];
}

const DOCUMENT_SELECT = "id, owner, shipment_id, doc_type, status, fields, approved_at, approved_by, corrected_fields, corrected_at";

/**
 * Approve a parsed document's extracted values.
 *
 * This is the signal every write-back path waits for, so it refuses while the
 * shipment still has an unresolved critical discrepancy. Approving a document
 * whose values are known to conflict with another document would defeat the
 * product: the point is to catch the error before it reaches the TMS.
 */
export async function approveDocument(
  owner: string,
  documentId: string,
  options: { approvedBy?: string | null; admin?: Admin } = {}
): Promise<{ document: DocumentSummary } | { error: "not_found" | "not_parsed" | "blocked" | "write_failed"; openCritical?: number; detail?: string }> {
  const admin = options.admin ?? createAdminClient();
  const { data: document } = await admin
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .eq("owner", owner)
    .maybeSingle();
  if (!document) return { error: "not_found" };
  if (document.status !== "parsed") return { error: "not_parsed" };

  if (document.shipment_id) {
    const { count } = await admin
      .from("discrepancies")
      .select("id", { count: "exact", head: true })
      .eq("shipment_id", document.shipment_id)
      .eq("severity", "red")
      .eq("resolved", false);
    if ((count ?? 0) > 0) return { error: "blocked", openCritical: count ?? 0 };
  }

  // Idempotent: approving twice is a no-op that still reports success, because
  // an integration retrying after a timeout must not get an error for work it
  // already completed.
  if (document.approved_at) {
    return { document: summarize(document) };
  }

  const approvedAt = new Date().toISOString();
  // `approved_by` is a uuid column, so the account is recorded there and any
  // free-text actor an integration supplies goes into the event only.
  const { error } = await admin
    .from("documents")
    .update({ approved_at: approvedAt, approved_by: owner })
    .eq("id", documentId)
    .eq("owner", owner);
  // Never announce a write that did not land.
  if (error) return { error: "write_failed", detail: error.message };

  await admin.from("events").insert({
    owner,
    type: "document_approved",
    payload: { document_id: documentId, shipment_id: document.shipment_id },
  });

  await emitWebhook(owner, "document.approved", {
    document_id: documentId,
    shipment_id: document.shipment_id,
    approved_by: options.approvedBy ?? null,
    document_type: document.doc_type,
  });

  return { document: { ...summarize(document), approved_at: approvedAt } };
}

/**
 * Overwrite extracted field values a reviewer disagrees with.
 *
 * Only top-level keys already present in the extraction may be written. A
 * correction is a reviewer saying "the parser misread this printed value", not
 * a way to invent fields the document never had — and an integration that could
 * add arbitrary keys would quietly corrupt every downstream mapping.
 */
export async function correctDocument(
  owner: string,
  documentId: string,
  patch: Record<string, unknown>,
  options: { correctedBy?: string | null; admin?: Admin } = {}
): Promise<{ document: DocumentSummary; changed: string[] } | { error: "not_found" | "no_fields" | "unknown_fields" | "write_failed"; unknown?: string[]; detail?: string }> {
  const admin = options.admin ?? createAdminClient();
  const { data: document } = await admin
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .eq("owner", owner)
    .maybeSingle();
  if (!document) return { error: "not_found" };

  const fields = (document.fields ?? {}) as Record<string, unknown>;
  const keys = Object.keys(patch);
  if (keys.length === 0) return { error: "no_fields" };
  // `_meta` holds source evidence and page references. Letting it be rewritten
  // would let a caller forge the provenance the discrepancy report is built on.
  const unknown = keys.filter((key) => key === "_meta" || !(key in fields));
  if (unknown.length > 0) return { error: "unknown_fields", unknown };

  const changed = keys.filter((key) => JSON.stringify(fields[key]) !== JSON.stringify(patch[key]));
  if (changed.length === 0) return { document: summarize(document), changed: [] };

  const correctedAt = new Date().toISOString();
  const merged = { ...fields, ...patch };
  const correctedFields = [...new Set([...(document.corrected_fields ?? []), ...changed])];

  const { error } = await admin
    .from("documents")
    .update({ fields: merged, corrected_fields: correctedFields, corrected_at: correctedAt })
    .eq("id", documentId)
    .eq("owner", owner);
  if (error) return { error: "write_failed", detail: error.message };

  await admin.from("events").insert({
    owner,
    type: "document_corrected",
    payload: { document_id: documentId, fields: changed },
  });

  await emitWebhook(owner, "document.corrected", {
    document_id: documentId,
    shipment_id: document.shipment_id,
    fields: changed,
    corrected_by: options.correctedBy ?? null,
  });

  // A corrected value can resolve or create a mismatch, so the shipment's
  // findings are stale the moment a field changes. Re-running here is what
  // stops a reviewer approving against a discrepancy list that no longer
  // reflects the document.
  if (document.shipment_id) await matchShipment(owner, document.shipment_id, { admin });

  return { document: { ...summarize(document), corrected_fields: correctedFields }, changed };
}

/**
 * Publish `shipment.created`.
 *
 * A shipment is opened from several places in the auto-linking logic — master,
 * house, standalone and reference-matched — and each one is a real new shipment
 * to a receiving system. Kept here so all four say the same thing, and so
 * adding a fifth linking path does not silently skip the event.
 */
export async function announceShipmentCreated(
  owner: string,
  shipmentId: string,
  reference: string | null,
  billLevel: string
): Promise<void> {
  await emitWebhook(owner, "shipment.created", {
    shipment_id: shipmentId,
    reference,
    bl_number: reference,
    bill_level: billLevel,
  });
}

/**
 * A snapshot of the open findings, taken before matching replaces them.
 *
 * Matching deletes and reinserts every unresolved row, so without a "before"
 * the re-inserted rows all look new and every re-run re-notifies the whole
 * list. A channel that cries wolf is muted within a week, and then the genuine
 * alerts are missed too.
 */
export async function openFindingKeys(shipmentId: string, admin?: Admin): Promise<Set<string>> {
  const client = admin ?? createAdminClient();
  const { data } = await client
    .from("discrepancies")
    .select("field, doc_a, doc_b")
    .eq("shipment_id", shipmentId)
    .eq("resolved", false);
  return new Set((data ?? []).map((row) => `${row.field}|${row.doc_a}|${row.doc_b}`));
}

/**
 * Publish the outcome of a matching pass.
 *
 * Split out of `matchShipment` because the workspace's own check action has its
 * own matching implementation, and both have to announce results the same way.
 * Pass the keys captured by `openFindingKeys` before the pass ran.
 */
export async function announceMatchOutcome(
  owner: string,
  shipmentId: string,
  seen: Set<string>,
  options: { admin?: Admin } = {}
): Promise<{ critical: number; warnings: number; created: number }> {
  const admin = options.admin ?? createAdminClient();
  const [{ data: after }, { data: shipment }, { count: documentsCompared }] = await Promise.all([
    admin
      .from("discrepancies")
      .select("id, severity, field, value_a, value_b, doc_a, doc_b, message")
      .eq("shipment_id", shipmentId)
      .eq("resolved", false),
    admin.from("shipments").select("ref, bl_number").eq("id", shipmentId).maybeSingle(),
    admin.from("documents").select("id", { count: "exact", head: true }).eq("shipment_id", shipmentId).eq("status", "parsed"),
  ]);

  const rows = after ?? [];
  const fresh = rows.filter((row) => !seen.has(`${row.field}|${row.doc_a}|${row.doc_b}`));
  const critical = rows.filter((row) => row.severity === "red").length;

  await emitWebhook(owner, "shipment.matched", {
    shipment_id: shipmentId,
    documents_compared: documentsCompared ?? 0,
    fields_compared: rows.length + seen.size,
    critical,
    warnings: rows.length - critical,
  });

  for (const row of fresh) {
    await emitWebhook(owner, "discrepancy.created", {
      discrepancy_id: row.id,
      shipment_id: shipmentId,
      severity: row.severity,
      field: row.field,
      value_a: row.value_a,
      value_b: row.value_b,
      doc_a: row.doc_a,
      doc_b: row.doc_b,
      message: row.message,
      reference: shipment?.ref ?? shipment?.bl_number ?? null,
    });
  }

  if (fresh.some((row) => row.severity === "red")) {
    await emitWebhook(owner, "document.review_required", {
      document_id: null,
      shipment_id: shipmentId,
      reason: "Cross-document matching found a critical discrepancy.",
      open_discrepancies: rows.length,
    });
  }

  return { critical, warnings: rows.length - critical, created: fresh.length };
}

/**
 * Run cross-document matching and publish what it found.
 */
export async function matchShipment(
  owner: string,
  shipmentId: string,
  options: { admin?: Admin } = {}
): Promise<{ documentsCompared: number; critical: number; warnings: number; created: number } | { error: "not_found" }> {
  const admin = options.admin ?? createAdminClient();
  const { data: shipment } = await admin
    .from("shipments")
    .select("id, owner, ref, bl_number")
    .eq("id", shipmentId)
    .eq("owner", owner)
    .maybeSingle();
  if (!shipment) return { error: "not_found" };

  const seen = await openFindingKeys(shipmentId, admin);
  await runAutomatedShipmentCheck(admin, owner, shipmentId);
  const outcome = await announceMatchOutcome(owner, shipmentId, seen, { admin });

  const { count: documentsCompared } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("shipment_id", shipmentId)
    .eq("status", "parsed");

  return { documentsCompared: documentsCompared ?? 0, ...outcome };
}

/** Close a discrepancy, recording who decided and why. */
export async function resolveDiscrepancy(
  owner: string,
  discrepancyId: string,
  options: { status?: string | null; note?: string | null; resolvedBy?: string | null; admin?: Admin } = {}
): Promise<{ shipmentId: string } | { error: "not_found" | "write_failed"; detail?: string }> {
  const admin = options.admin ?? createAdminClient();
  const { data: discrepancy } = await admin
    .from("discrepancies")
    .select("id, owner, shipment_id, resolved")
    .eq("id", discrepancyId)
    .eq("owner", owner)
    .maybeSingle();
  if (!discrepancy) return { error: "not_found" };

  if (!discrepancy.resolved) {
    const { error } = await admin
      .from("discrepancies")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_status: options.status ?? "resolved",
        resolution_note: options.note ?? null,
        // `resolved_by` is a uuid foreign key to the account; the free-text
        // label an integration sends belongs in `resolved_by_email`. Writing
        // text into the uuid column fails the whole update.
        resolved_by: owner,
        resolved_by_email: options.resolvedBy ?? null,
      })
      .eq("id", discrepancyId)
      .eq("owner", owner);

    // Emit only after the write is known to have landed. Announcing a
    // resolution that did not happen is worse than staying silent: the
    // customer's system closes its exception and the discrepancy is still open
    // here, with nothing to reconcile the two.
    if (error) return { error: "write_failed", detail: error.message };

    await emitWebhook(owner, "discrepancy.resolved", {
      discrepancy_id: discrepancyId,
      shipment_id: discrepancy.shipment_id,
      resolution_status: options.status ?? "resolved",
      resolved_by: options.resolvedBy ?? null,
      note: options.note ?? null,
    });
  }

  return { shipmentId: discrepancy.shipment_id as string };
}

function summarize(row: Record<string, unknown>): DocumentSummary {
  return {
    id: row.id as string,
    shipment_id: (row.shipment_id as string | null) ?? null,
    doc_type: row.doc_type as string,
    status: row.status as string,
    approved_at: (row.approved_at as string | null) ?? null,
    corrected_fields: (row.corrected_fields as string[] | null) ?? [],
  };
}
