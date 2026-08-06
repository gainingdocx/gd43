import "server-only";

import { parseDocumentInputs } from "@/lib/ai/router";
import { addHsSuggestions } from "@/lib/ai/hs-classifier";
import { translateExtraction } from "@/lib/ai/translate";
import { isTranslationLanguage } from "@/lib/ai/languages";
import { persistResult } from "@/app/api/parse/route";
import { validateDocument } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageContext } from "@/lib/billing/usage";
import { runAutomatedShipmentCheck } from "@/lib/shipments/automated-check";
import { announceMatchOutcome, openFindingKeys } from "@/lib/workflow/operations";
import { discrepancyNoticePdf, type NoticeDiscrepancy } from "@/lib/export/discrepancy-pdf";
import { sendCloudflareEmail } from "@/lib/email/cloudflare";
import { logError, logInfo } from "@/lib/observability/logger";

function cleanFilename(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "shipment-document";
}

function html(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] as string);
}

async function makeReports(admin: ReturnType<typeof createAdminClient>, shipmentIds: string[]) {
  const reports: Array<{ filename: string; content: string }> = [];
  let totalFindings = 0;
  for (const shipmentId of shipmentIds) {
    const [{ data: shipment }, { data: docs }, { data: discrepancies }] = await Promise.all([
      admin.from("shipments").select("bl_number, ref").eq("id", shipmentId).maybeSingle(),
      admin.from("documents").select("id, doc_type").eq("shipment_id", shipmentId),
      admin.from("discrepancies").select("severity, field, workflow_key, rule_reason, source_evidence, questioned_amount, questioned_currency, doc_a, doc_b, value_a, value_b, message").eq("shipment_id", shipmentId).eq("resolved", false),
    ]);
    const rows = discrepancies ?? [];
    totalFindings += rows.length;
    if (!rows.length) continue;
    const labels = new Map((docs ?? []).map((doc) => [doc.id, doc.doc_type.replace(/_/g, " ")]));
    const reference = shipment?.bl_number ?? shipment?.ref ?? `shipment-${shipmentId.slice(0, 8)}`;
    const noticeRows: NoticeDiscrepancy[] = rows.map((item) => ({
      severity: item.severity as "red" | "amber" | "info", field: item.field,
      documentA: labels.get(item.doc_a) ?? "Document A", documentB: labels.get(item.doc_b) ?? "Document B",
      valueA: item.value_a, valueB: item.value_b, message: item.message,
      ruleReason: item.rule_reason, workflow: item.workflow_key,
      sourceA: (item.source_evidence as { a?: NoticeDiscrepancy["sourceA"] } | null)?.a,
      sourceB: (item.source_evidence as { b?: NoticeDiscrepancy["sourceB"] } | null)?.b,
      questionedAmount: item.questioned_amount ? Number(item.questioned_amount) : null,
      questionedCurrency: item.questioned_currency,
    }));
    const pdf = await discrepancyNoticePdf({ shipmentReference: reference, discrepancies: noticeRows });
    reports.push({ filename: `${cleanFilename(reference)}-discrepancy-report.pdf`, content: Buffer.from(pdf).toString("base64") });
  }
  return { reports, totalFindings };
}

async function sendResultEmail(options: {
  to: string; subject: string; processed: number; skipped: string[]; failed: string[];
  shipmentIds: string[]; reports: Array<{ filename: string; content: string }>; totalFindings: number;
}) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://gainingdocx.com").replace(/\/$/, "");
  const status = options.failed.length ? "completed with items to review" : "is ready";
  const shipmentLinks = options.shipmentIds.map((id, index) => `<li><a href="${base}/app/shipments/${id}">Open shipment ${index + 1}</a></li>`).join("");
  const detail = [...options.skipped.map((item) => `Skipped: ${item}`), ...options.failed.map((item) => `Could not process: ${item}`)];
  let encodedBytes = 0;
  const emailReports = options.reports.filter((report) => {
    encodedBytes += report.content.length;
    return encodedBytes <= 4_500_000;
  });
  const attachmentNote = options.reports.length > emailReports.length
    ? " One or more reports were too large for email and remain available from the shipment links."
    : "";
  await sendCloudflareEmail({
    to: options.to,
    subject: `Shipment document check ${status}: ${options.subject || "forwarded documents"}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;color:#102a56"><h1 style="font-size:22px">Your shipment document check ${status}</h1><p>GainingDocx processed <strong>${options.processed}</strong> attachment${options.processed === 1 ? "" : "s"} and found <strong>${options.totalFindings}</strong> open discrepanc${options.totalFindings === 1 ? "y" : "ies"}.</p>${shipmentLinks ? `<ul>${shipmentLinks}</ul>` : "<p>The documents are in your workspace. Add a shipment reference if they could not be grouped automatically.</p>"}${emailReports.length ? `<p>The discrepancy report is attached.${attachmentNote} Review each finding against the original document before operational use.</p>` : "<p>No cross-document discrepancy report was attached. Review extracted fields in the workspace before operational use.</p>"}${detail.length ? `<p style="color:#7a4c00">${detail.map(html).join("<br>")}</p>` : ""}<p><a href="${base}/app/email-in">Manage email-in</a> · <a href="${base}/app/scan?type=batch">Upload another document set</a></p></div>`,
    text: `Your shipment document check ${status}. Processed: ${options.processed}. Open discrepancies: ${options.totalFindings}. Open your workspace: ${base}/app/email-in`,
    attachments: emailReports.map((report) => ({ filename: report.filename, content: report.content, type: "application/pdf", disposition: "attachment" as const })),
  });
}

export async function processEmailIngestion(ingestionId: string) {
  const admin = createAdminClient();
  const { data: ingestion } = await admin.from("email_ingestions").select("*").eq("id", ingestionId).maybeSingle();
  if (!ingestion || ingestion.status === "processed") return;
  const priorNote = typeof ingestion.error === "string" && ingestion.error.startsWith("Skipped:") ? ingestion.error : null;
  await admin.from("email_ingestions").update({ status: "processing", error: priorNote }).eq("id", ingestionId);

  const failed: string[] = [];
  const skipped: string[] = priorNote ? priorNote.replace(/^Skipped:\s*/, "").split(", ").filter(Boolean) : [];
  try {
    const [{ data: documents }, { data: profile }] = await Promise.all([
      admin.from("documents").select("id, status, source_filename, source_mime_type, source_file_path").eq("ingestion_id", ingestionId).order("created_at"),
      admin.from("profiles").select("default_translation_language, email_ingest_reply").eq("id", ingestion.owner).maybeSingle(),
    ]);
    const documentIds = (documents ?? []).map((document) => document.id as string);
    const translation = isTranslationLanguage(profile?.default_translation_language) ? profile.default_translation_language : null;

    for (const document of documents ?? []) {
      if (document.status === "parsed") continue;
      const filename = document.source_filename || `document-${document.id.slice(0, 8)}`;
      if (!document.source_file_path || !document.source_mime_type) { failed.push(filename); continue; }
      const usage = await getUsageContext(ingestion.owner);
      if (usage.used >= usage.limit) { skipped.push(`${filename} (monthly allowance reached)`); continue; }
      try {
        const { data: signed, error: signError } = await admin.storage.from("docs").createSignedUrl(document.source_file_path, 3600);
        if (signError || !signed?.signedUrl) throw signError ?? new Error("could not sign attachment");
        await admin.from("documents").update({ status: "parsing" }).eq("id", document.id);
        const result = await parseDocumentInputs([
          document.source_mime_type === "application/pdf"
            ? { kind: "pdf", url: signed.signedUrl, filename }
            : { kind: "image", url: signed.signedUrl },
        ]);
        if (translation) await translateExtraction(result.extraction, translation);
        await addHsSuggestions(result.extraction);
        await persistResult(admin, ingestion.owner, document.id, result, validateDocument(result.extraction));
      } catch (error) {
        failed.push(filename);
        await admin.from("documents").update({ status: "failed" }).eq("id", document.id);
        logError("email_ingestion_attachment_failed", error, { ingestionId, documentId: document.id, filename });
      }
    }

    const { data: emailDocuments } = documentIds.length
      ? await admin.from("documents").select("id, shipment_id, status").in("id", documentIds)
      : { data: [] };
    let shipmentIds = [...new Set((emailDocuments ?? []).map((row) => row.shipment_id).filter((id): id is string => Boolean(id)))];
    const parsedUnlinked = (emailDocuments ?? []).filter((row) => row.status === "parsed" && !row.shipment_id).map((row) => row.id as string);
    if (parsedUnlinked.length && shipmentIds.length === 1) {
      await admin.from("documents").update({ shipment_id: shipmentIds[0] }).in("id", parsedUnlinked);
    } else if (parsedUnlinked.length && shipmentIds.length === 0) {
      const subjectRef = String(ingestion.subject || `Email ${ingestionId.slice(0, 8)}`).replace(/^\s*(fw|fwd|re)\s*:\s*/i, "").trim().slice(0, 120);
      const { data: shipment, error: shipmentError } = await admin.from("shipments").insert({ owner: ingestion.owner, ref: subjectRef }).select("id").single();
      if (!shipmentError && shipment) {
        await admin.from("documents").update({ shipment_id: shipment.id }).in("id", parsedUnlinked);
        shipmentIds = [shipment.id];
      }
    }
    for (const shipmentId of shipmentIds) {
      // Snapshot then announce, so an emailed batch publishes the same
      // shipment.matched and discrepancy.created events a workspace check does.
      // Previously this path ran the engine and told nobody.
      const seen = await openFindingKeys(shipmentId, admin);
      await runAutomatedShipmentCheck(admin, ingestion.owner, shipmentId);
      await announceMatchOutcome(ingestion.owner, shipmentId, seen, { admin });
    }
    const { reports, totalFindings } = await makeReports(admin, shipmentIds);
    const processed = (emailDocuments ?? []).filter((row) => row.status === "parsed").length;
    const status = processed === 0 ? "failed" : failed.length || skipped.length ? "partial" : "processed";
    let deliveryError: string | null = null;
    if (profile?.email_ingest_reply !== false) {
      try {
        await sendResultEmail({ to: ingestion.sender, subject: ingestion.subject ?? "", processed, skipped, failed, shipmentIds, reports, totalFindings });
      } catch (error) {
        deliveryError = "Report email could not be delivered; the results remain available in the workspace.";
        logError("email_ingestion_reply_failed", error, { ingestionId, recipient: ingestion.sender });
      }
    }
    await admin.from("email_ingestions").update({
      status, processed_count: processed, document_ids: documentIds, shipment_ids: shipmentIds,
      error: [...skipped, ...failed, ...(deliveryError ? [deliveryError] : [])].join(", ").slice(0, 1000) || null,
      completed_at: new Date().toISOString(),
    }).eq("id", ingestionId);
    logInfo("email_ingestion_completed", { ingestionId, processed, skipped: skipped.length, failed: failed.length, shipmentCount: shipmentIds.length, totalFindings, replyDelivered: !deliveryError });
  } catch (error) {
    await admin.from("email_ingestions").update({ status: "failed", error: error instanceof Error ? error.message.slice(0, 1000) : "Processing failed" }).eq("id", ingestionId);
    logError("email_ingestion_failed", error, { ingestionId });
    throw error;
  }
}
