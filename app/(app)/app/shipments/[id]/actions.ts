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

  const result = runThreeWayMatch(shipmentDocs, DEFAULT_MATCH_POLICY);
  const findings = matchFindings(result);

  // Replace unresolved rows; resolved history stays.
  await supabase
    .from("discrepancies")
    .delete()
    .eq("shipment_id", shipmentId)
    .eq("resolved", false);
  if (findings.length > 0) {
    await supabase.from("discrepancies").insert(
      findings.map((f) => ({
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
      }))
    );
  }
  await supabase.from("match_runs").insert({
    shipment_id: shipmentId,
    owner: user.id,
    schema_version: result.schema_version,
    decision: result.decision,
    score: result.score,
    policy: DEFAULT_MATCH_POLICY,
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
    },
  });
  revalidatePath(`/app/shipments/${shipmentId}`);
}

export async function resolveDiscrepancy(formData: FormData) {
  const id = String(formData.get("discrepancyId") ?? "");
  const winner = String(formData.get("winner") ?? ""); // 'a' | 'b' | 'dismiss'
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

  await supabase.from("discrepancies").update({ resolved: true }).eq("id", id);
  await supabase.from("events").insert({
    owner: user.id,
    type: "discrepancy_resolved",
    payload: { discrepancy_id: id, winner },
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
  return { supabase, user, shipment, role: shipment.owner === user.id ? "owner" : membership?.role ?? null };
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
  const { data: profile } = await admin.from("profiles").select("id, full_name").ilike("email", email).maybeSingle();
  await access.supabase.from("shipment_members").upsert({
    shipment_id: shipmentId,
    owner: access.shipment.owner,
    member_id: profile?.id ?? null,
    email,
    display_name: profile?.full_name ?? null,
    role,
    status: profile ? "active" : "pending",
    invited_by: access.user.id,
  }, { onConflict: "shipment_id,email" });
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
  await access.supabase.from("shipment_members").update({ status: "removed" }).eq("id", memberId).eq("shipment_id", shipmentId);
  refreshShipment(shipmentId);
}

export async function updateDocumentWorkflow(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const status = String(formData.get("status") ?? "in_review");
  const assigneeEmail = String(formData.get("assigneeEmail") ?? "").trim().toLowerCase();
  const access = await currentShipmentAccess(shipmentId);
  if (!access || !["unassigned", "in_review", "correction_requested", "approved"].includes(status)) return;
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
  if (!access || !body || !["comment", "correction_request", "approval"].includes(kind)) return;
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
  if (!access || access.role !== "owner") return;
  await access.supabase.from("shipments").update({
    export_approval_required: String(formData.get("required") ?? "") === "true",
  }).eq("id", shipmentId);
  refreshShipment(shipmentId);
}

export async function requestExportApproval(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const access = await currentShipmentAccess(shipmentId);
  if (!access) return;
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
  if (!access || !["owner", "approver"].includes(access.role ?? "") || !["approved", "rejected"].includes(decision)) return;
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
