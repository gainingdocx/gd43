"use server";

// Shipment Check + discrepancy resolver (BUILD_SPEC §M6.4). The check is
// deterministic crossCheck() over the shipment's parsed docs; the resolver
// writes the winning value into the losing document where a safe mapping
// exists, and audits everything to events.

import { revalidatePath } from "next/cache";

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { setPath } from "@/lib/fields/display";
import { coerceCorrection, correctionPath } from "@/lib/shipments/resolve";
import { DEFAULT_MATCH_POLICY, matchFindings, runThreeWayMatch } from "@/lib/matching";
import { createClient } from "@/lib/supabase/server";
import {
  validateDocument,
  type ShipmentDoc,
  type ValidationResult,
} from "@/lib/validators";
import { DEFAULT_REQUIREMENTS } from "@/lib/shipments/completeness";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitWebhook } from "@/lib/integrations/webhooks";
import { announceMatchOutcome, approveDocument, openFindingKeys } from "@/lib/workflow/operations";
import { TEAM_SEAT_LIMIT } from "@/lib/plans";

export async function runShipmentCheck(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  if (!shipmentId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: docs } = await supabase
    .from("documents")
    .select("id, doc_type, fields")
    .eq("shipment_id", shipmentId)
    .eq("status", "parsed");

  const shipmentDocs: ShipmentDoc[] = (docs ?? [])
    .filter((d) => d.fields && d.doc_type !== "other")
    .map((d) => ({
      id: d.id as string,
      extraction: {
        detected_type: d.doc_type,
        fields: d.fields,
      } as NormalizedExtraction,
    }));

  const policyNumber = (name: string, fallback: number, max: number) => {
    const value = Number(formData.get(name));
    return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : fallback;
  };
  const policy = {
    amount_percent: policyNumber("amountPercent", DEFAULT_MATCH_POLICY.amount_percent, 100),
    amount_absolute: policyNumber("amountAbsolute", DEFAULT_MATCH_POLICY.amount_absolute, 1_000_000),
    quantity_percent: policyNumber("quantityPercent", DEFAULT_MATCH_POLICY.quantity_percent, 100),
  };
  const result = runThreeWayMatch(shipmentDocs, policy);
  const findings = matchFindings(result);
  const documentsById = new Map(shipmentDocs.map((document) => [document.id, document]));
  const rulesById = new Map(result.rules.map((rule) => [rule.rule_id, rule]));
  const evidenceFor = (documentId: string | null, path: string | null) => {
    if (!documentId || !path) return null;
    const fields = documentsById.get(documentId)?.extraction.fields;
    const meta = fields?._meta;
    const top = path.replace(/^fields\./, "").split(".")[0].split("[")[0];
    const evidence = meta?.source_evidence?.[path] ?? meta?.source_evidence?.[top];
    const page = evidence?.page ?? meta?.page_refs?.[top] ?? null;
    return page ? { page, quote: evidence?.quote ?? null, bbox: evidence?.bbox ?? null, field_path: path } : null;
  };

  // Captured before the replace below, so only genuinely new mismatches are
  // announced. Re-running a check must not re-notify a channel about findings
  // the reviewer has already seen.
  const seenFindings = await openFindingKeys(shipmentId);

  // Replace unresolved rows; resolved history stays.
  await supabase
    .from("discrepancies")
    .delete()
    .eq("shipment_id", shipmentId)
    .eq("resolved", false);
  if (findings.length > 0) {
    await supabase.from("discrepancies").insert(
      findings.map((f) => {
        const rule = rulesById.get(f.field);
        return ({
        shipment_id: shipmentId,
        owner: user.id,
        severity: f.severity,
        field: f.field,
        doc_a: f.doc_a,
        doc_b: f.doc_b,
        value_a: f.value_a,
        value_b: f.value_b,
        message: f.message,
        category: f.category,
        tolerance: f.tolerance,
        workflow_key: f.workflow,
        rule_reason: f.rule_reason,
        questioned_amount: f.questioned_amount,
        questioned_currency: f.questioned_currency,
        source_evidence: {
          a: evidenceFor(f.doc_a, rule?.field_a ?? null),
          b: evidenceFor(f.doc_b, rule?.field_b ?? null),
        },
      }); })
    );
  }
  await supabase.from("match_runs").insert({
    shipment_id: shipmentId,
    owner: user.id,
    schema_version: result.schema_version,
    decision: result.decision,
    score: result.score,
    policy,
    result,
  });
  await supabase.from("events").insert({
    owner: user.id,
    type: "check_run",
    payload: {
      shipment_id: shipmentId,
      docs: shipmentDocs.length,
      findings: findings.length,
      decision: result.decision,
      score: result.score,
      policy,
    },
  });
  // shipment.matched and discrepancy.created are published here rather than
  // inside the matching engine: the engine is pure, and only the caller knows
  // what the findings looked like beforehand.
  await announceMatchOutcome(user.id, shipmentId, seenFindings);
  revalidatePath(`/app/shipments/${shipmentId}`);
}

export async function resolveDiscrepancy(formData: FormData) {
  const id = String(formData.get("discrepancyId") ?? "");
  const winner = String(formData.get("winner") ?? ""); // 'a' | 'b' | 'dismiss'
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim().slice(0, 1000) || null;
  if (!id || !["a", "b", "dismiss"].includes(winner)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: disc } = await supabase
    .from("discrepancies")
    .select("id, shipment_id, field, doc_a, doc_b, value_a, value_b, resolved")
    .eq("id", id)
    .maybeSingle();
  if (!disc || disc.resolved) return;

  if (winner !== "dismiss") {
    const losingId = winner === "a" ? disc.doc_b : disc.doc_a;
    const winningValue = winner === "a" ? disc.value_a : disc.value_b;
    if (losingId && winningValue !== null) {
      const { data: losing } = await supabase
        .from("documents")
        .select("id, doc_type, fields, validation")
        .eq("id", losingId)
        .maybeSingle();
      const path = losing ? correctionPath(disc.field, losing.doc_type) : null;
      if (losing?.fields && path) {
        const next = setPath(
          losing.fields as Record<string, unknown>,
          path,
          coerceCorrection(path, winningValue)
        );
        const extraction = {
          detected_type: losing.doc_type,
          fields: next,
        } as unknown as NormalizedExtraction;
        const prior = (losing.validation ?? []) as ValidationResult[];
        const validation = [
          ...validateDocument(extraction),
          ...prior.filter((result) => result.rule === "duplicates"),
        ];
        await supabase
          .from("documents")
          .update({ fields: next, validation })
          .eq("id", losingId);
        await supabase.from("events").insert({
          owner: user.id,
          type: "discrepancy_correction",
          payload: {
            discrepancy_id: id,
            document_id: losingId,
            field: path,
            value: winningValue,
          },
        });
      }
    }
  }

  await supabase.from("discrepancies").update({
    resolved: true,
    resolution_status: winner === "dismiss" ? "dismissed" : "corrected",
    resolved_by: user.id,
    resolved_by_email: user.email ?? null,
    resolved_at: new Date().toISOString(),
    resolution_note: resolutionNote,
  }).eq("id", id);
  await supabase.from("events").insert({
    owner: user.id,
    type: "discrepancy_resolved",
    payload: { discrepancy_id: id, winner, resolution_note: resolutionNote },
  });
  // Emitted directly rather than through lib/workflow/operations: that helper
  // only publishes when it is the one closing the row, and the update above has
  // already done so. Routing through it here would silently emit nothing.
  await emitWebhook(user.id, "discrepancy.resolved", {
    discrepancy_id: id,
    shipment_id: disc.shipment_id,
    resolution_status: winner === "dismiss" ? "dismissed" : "corrected",
    resolved_by: user.email ?? user.id,
    note: resolutionNote,
  });
  revalidatePath(`/app/shipments/${disc.shipment_id}`);
}

async function currentShipmentAccess(shipmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: shipment } = await supabase.from("shipments").select("id, owner").eq("id", shipmentId).maybeSingle();
  if (!shipment) return null;
  const { data: membership } = shipment.owner === user.id ? { data: null } : await supabase
    .from("shipment_members").select("role").eq("shipment_id", shipmentId).eq("member_id", user.id).eq("status", "active").maybeSingle();
  const { data: ownerProfile } = await createAdminClient().from("profiles").select("plan").eq("id", shipment.owner).maybeSingle();
  return { supabase, user, shipment, role: shipment.owner === user.id ? "owner" : membership?.role ?? null, teamEnabled: ownerProfile?.plan === "team" };
}

function refreshShipment(shipmentId: string) {
  revalidatePath(`/app/shipments/${shipmentId}`);
  revalidatePath("/app/shipments");
}

export async function saveRequirement(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const key = String(formData.get("requirementKey") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access || !["owner", "editor"].includes(access.role ?? "")) return;
  const standard = DEFAULT_REQUIREMENTS.find((item) => item.requirement_key === key);
  const customLabel = String(formData.get("label") ?? "").trim().slice(0, 100);
  const custom = !standard && customLabel ? {
    requirement_key: `custom-${customLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`,
    label: customLabel,
    accepted_types: ["other"],
    filename_hint: String(formData.get("filenameHint") ?? customLabel).trim().slice(0, 80),
  } : null;
  const requirement = standard ?? custom;
  if (!requirement) return;
  await access.supabase.from("shipment_requirements").upsert({
    shipment_id: shipmentId,
    owner: access.shipment.owner,
    requirement_key: requirement.requirement_key,
    label: requirement.label,
    accepted_types: requirement.accepted_types,
    filename_hint: requirement.filename_hint ?? null,
    required: String(formData.get("required") ?? "") === "true",
  }, { onConflict: "shipment_id,requirement_key" });
  await access.supabase.from("events").insert({
    owner: access.shipment.owner,
    type: "shipment_requirement_updated",
    payload: { shipment_id: shipmentId, requirement_key: requirement.requirement_key },
  });
  refreshShipment(shipmentId);
}

export async function inviteTeamMember(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const role = String(formData.get("role") ?? "reviewer");
  const access = await currentShipmentAccess(shipmentId);
  if (!access || access.role !== "owner" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !["reviewer", "editor", "approver"].includes(role)) return;
  const admin = createAdminClient();
  const [{ data: ownerProfile }, { data: workspace }] = await Promise.all([
    admin.from("profiles").select("plan").eq("id", access.shipment.owner).maybeSingle(),
    admin.from("team_workspaces").select("id").eq("owner", access.shipment.owner).maybeSingle(),
  ]);
  if (ownerProfile?.plan !== "team" || !workspace) return;
  const [{ count }, { data: existing }] = await Promise.all([
    admin.from("team_members").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).neq("status", "removed"),
    admin.from("team_members").select("id").eq("workspace_id", workspace.id).eq("email", email).maybeSingle(),
  ]);
  if (!existing && (count ?? 0) >= TEAM_SEAT_LIMIT - 1) return;
  const { data: profile } = await admin.from("profiles").select("id, full_name").ilike("email", email).maybeSingle();
  const member = {
    workspace_id: workspace.id,
    member_id: profile?.id ?? null,
    email,
    display_name: profile?.full_name ?? null,
    role,
    status: profile ? "active" : "pending",
    invited_by: access.user.id,
  };
  if (existing) await admin.from("team_members").update(member).eq("id", existing.id);
  else await admin.from("team_members").insert(member);
  await access.supabase.from("events").insert({
    owner: access.shipment.owner,
    type: "shipment_member_invited",
    payload: { shipment_id: shipmentId, email, role, status: profile ? "active" : "pending" },
  });
  refreshShipment(shipmentId);
}

export async function removeTeamMember(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access || access.role !== "owner") return;
  const admin = createAdminClient();
  const { data: shipmentMember } = await admin.from("shipment_members").select("email").eq("id", memberId).eq("shipment_id", shipmentId).maybeSingle();
  const { data: workspace } = await admin.from("team_workspaces").select("id").eq("owner", access.shipment.owner).maybeSingle();
  if (shipmentMember && workspace) await admin.from("team_members").update({ status: "removed" }).eq("workspace_id", workspace.id).eq("email", shipmentMember.email);
  refreshShipment(shipmentId);
}

export async function updateDocumentWorkflow(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const status = String(formData.get("status") ?? "in_review");
  const assigneeEmail = String(formData.get("assigneeEmail") ?? "").trim().toLowerCase();
  const access = await currentShipmentAccess(shipmentId);
  if (!access?.teamEnabled || !["unassigned", "in_review", "correction_requested", "approved"].includes(status)) return;
  if (assigneeEmail && !["owner", "editor"].includes(access.role ?? "")) return;
  const { data: assignee } = assigneeEmail ? await access.supabase.from("shipment_members")
    .select("member_id, email").eq("shipment_id", shipmentId).eq("email", assigneeEmail).eq("status", "active").maybeSingle() : { data: null };
  await access.supabase.from("document_workflows").upsert({
    document_id: documentId,
    shipment_id: shipmentId,
    owner: access.shipment.owner,
    assignee_id: assignee?.member_id ?? null,
    assignee_email: assignee?.email ?? null,
    status,
    updated_by: access.user.id,
  });
  await access.supabase.from("events").insert({
    owner: access.shipment.owner,
    type: "document_workflow_updated",
    payload: { shipment_id: shipmentId, document_id: documentId, status, assignee_email: assignee?.email ?? null },
  });
  await emitWebhook(access.shipment.owner, "review.updated", { shipment_id: shipmentId, document_id: documentId, status });
  refreshShipment(shipmentId);
}

export async function addDocumentComment(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const kind = String(formData.get("kind") ?? "comment");
  const access = await currentShipmentAccess(shipmentId);
  if (!access?.teamEnabled || !body || !["comment", "correction_request", "approval"].includes(kind)) return;
  await access.supabase.from("document_comments").insert({
    document_id: documentId, shipment_id: shipmentId, owner: access.shipment.owner,
    author: access.user.id, author_email: access.user.email ?? "team member", body, kind,
  });
  if (kind !== "comment") {
    await access.supabase.from("document_workflows").upsert({
      document_id: documentId, shipment_id: shipmentId, owner: access.shipment.owner,
      status: kind === "approval" ? "approved" : "correction_requested", updated_by: access.user.id,
    });
  }
  await access.supabase.from("events").insert({
    owner: access.shipment.owner, type: `document_${kind}`,
    payload: { shipment_id: shipmentId, document_id: documentId, comment: body },
  });
  await emitWebhook(access.shipment.owner, "review.updated", {
    shipment_id: shipmentId, document_id: documentId, action: kind, author: access.user.email,
  });
  refreshShipment(shipmentId);
}

export async function setExportApprovalRequired(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access?.teamEnabled || access.role !== "owner") return;
  await access.supabase.from("shipments").update({
    export_approval_required: String(formData.get("required") ?? "") === "true",
  }).eq("id", shipmentId);
  refreshShipment(shipmentId);
}

export async function requestExportApproval(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access?.teamEnabled) return;
  await access.supabase.from("export_approvals").insert({
    shipment_id: shipmentId, owner: access.shipment.owner, requested_by: access.user.id,
  });
  await emitWebhook(access.shipment.owner, "export.approval", { shipment_id: shipmentId, status: "pending" });
  refreshShipment(shipmentId);
}

export async function decideExportApproval(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const approvalId = String(formData.get("approvalId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access?.teamEnabled || !["owner", "approver"].includes(access.role ?? "") || !["approved", "rejected"].includes(decision)) return;
  await access.supabase.from("export_approvals").update({
    status: decision, decided_by: access.user.id, decided_at: new Date().toISOString(),
    decision_note: String(formData.get("note") ?? "").trim().slice(0, 500) || null,
  }).eq("id", approvalId).eq("shipment_id", shipmentId);
  await access.supabase.from("events").insert({
    owner: access.shipment.owner, type: "export_approval_decided",
    payload: { shipment_id: shipmentId, approval_id: approvalId, decision },
  });
  await emitWebhook(access.shipment.owner, "export.approval", { shipment_id: shipmentId, approval_id: approvalId, status: decision });
  refreshShipment(shipmentId);
}

export async function addChargeAlert(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access || !["owner", "editor"].includes(access.role ?? "")) return;
  const freeUntil = String(formData.get("freeUntil") ?? "");
  const alertType = String(formData.get("alertType") ?? "demurrage");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(freeUntil) || !["demurrage", "detention"].includes(alertType)) return;
  await access.supabase.from("charge_alerts").insert({
    shipment_id: shipmentId, owner: access.shipment.owner, alert_type: alertType,
    basis: "manual", free_until: freeUntil,
    notify_email: String(formData.get("notifyEmail") ?? access.user.email ?? "").trim() || null,
  });
  await access.supabase.from("events").insert({
    owner: access.shipment.owner, type: "charge_alert_created",
    payload: { shipment_id: shipmentId, alert_type: alertType, free_until: freeUntil },
  });
  refreshShipment(shipmentId);
}

export async function dismissChargeAlert(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access || !["owner", "editor"].includes(access.role ?? "")) return;
  await access.supabase.from("charge_alerts").update({ status: "dismissed" })
    .eq("id", String(formData.get("alertId") ?? "")).eq("shipment_id", shipmentId);
  refreshShipment(shipmentId);
}

/**
 * Approve a document's extracted values from the workspace.
 *
 * Same code path as POST /v1/documents/{id}/approve, so a reviewer clicking
 * here and an integration calling the API produce the identical state change
 * and the identical `document.approved` event.
 */
export async function approveDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return;

  const result = await approveDocument(user.id, documentId, { approvedBy: user.email ?? user.id });
  if ("document" in result && result.document.shipment_id) {
    revalidatePath(`/app/shipments/${result.document.shipment_id}`);
  }
  revalidatePath(`/app/review/${documentId}`);
}
