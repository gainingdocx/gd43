import { createClient } from "@/lib/supabase/server";
import { MAX_PAGES } from "@/lib/ai/config";
import { parseDocument } from "@/lib/ai/router";
import { containersOf, DETECTED_TYPES } from "@/lib/ai/schemas/extraction-v2";
import {
  containerCheckDigit,
  duplicates,
  validateDocument,
  type ValidationResult,
} from "@/lib/validators";
import { decideLink, type DocCandidate } from "@/lib/shipments/link";
import { billIdentity, normalizeBillNumber } from "@/lib/shipments/hierarchy";
import { emitWebhook } from "@/lib/integrations/webhooks";
import { announceShipmentCreated } from "@/lib/workflow/operations";
import {
  createRequestId,
  logError,
  logInfo,
  logWarn,
  publicReference,
} from "@/lib/observability/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { consumeGuestDocument } from "@/lib/guest-quota";
import { GUEST_DAILY_DOCUMENT_LIMIT } from "@/lib/plans";
import { getUsageContext } from "@/lib/billing/usage";
import { addHsSuggestions } from "@/lib/ai/hs-classifier";
import { syncExtractedChargeAlert } from "@/lib/shipments/charge-alerts";
import { isTranslationLanguage } from "@/lib/ai/languages";
import { translateExtraction } from "@/lib/ai/translate";
import { classifyPageGroups, type LogicalPageGroup } from "@/lib/ai/page-groups";
import type { DetectedType } from "@/lib/ai/schemas/shared";

// Parse a document from already-uploaded page images (SSE response).
// Heavy bytes never touch this Worker (spec §1.5): the browser uploads pages
// to Supabase Storage first and sends { storagePath } per page; the route
// turns them into short-lived signed URLs for the model. Plain https URLs are
// accepted for anonymous/testing flows.
//
// Body: { pages: [{ storagePath?: string; url?: string }], docTypeHint?, docId? }
// Events: status | fields | done | error

interface PageRef {
  storagePath?: string;
  url?: string;
  /** Anonymous flow: compressed page as a data URL (no storage access). */
  dataUrl?: string;
}

const ANON_MAX_PAGES = 3;
// Anonymous pages travel as base64. Cloudflare accepts substantially larger
// request bodies; this per-page ceiling leaves room for three high-resolution
// pages plus JSON overhead while protecting Worker memory and model latency.
// The client targets <=6 MiB raw with a 7 MiB hard fallback, which stays below
// 10M base64 characters. The total cap keeps three-page JSON/model forwarding
// comfortably inside the Worker's memory envelope.
const ANON_MAX_DATAURL = 10_000_000;
const ANON_MAX_TOTAL_DATAURL = 26_000_000;

const PUBLIC_PARSE_STATUS: Record<string, string> = {
  retrying: "Connection interrupted — retrying automatically",
  quality_retry: "Running an additional quality check",
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Duplicate-ref warn (spec §M5.6): other docs of this owner, same number. */
async function duplicateWarn(
  supabase: SupabaseClient,
  ownerId: string,
  documentId: string,
  extraction: Awaited<ReturnType<typeof parseDocument>>["extraction"]
): Promise<ValidationResult | null> {
  let kind: "bl_number" | "invoice_no";
  let value: string | null;
  if (extraction.detected_type === "bill_of_lading") {
    kind = "bl_number";
    value = extraction.fields.bl_number;
  } else if (extraction.detected_type === "commercial_invoice") {
    kind = "invoice_no";
    value = extraction.fields.invoice_no;
  } else {
    return null;
  }
  if (!value) return null;
  const { data } = await supabase
    .from("documents")
    .select(`id, ref:fields->>${kind}`)
    .eq("owner", ownerId)
    .neq("id", documentId)
    .not(`fields->>${kind}`, "is", null)
    .limit(500);
  const existing = (data ?? []).map((d) => ({
    id: d.id as string,
    value: (d as { ref: string | null }).ref,
  }));
  return duplicates(kind, value, existing);
}

/** Auto-link the parsed doc to a shipment (spec §M6.4); never re-links. */
async function autoLink(
  supabase: SupabaseClient,
  ownerId: string,
  documentId: string,
  extraction: Awaited<ReturnType<typeof parseDocument>>["extraction"]
) {
  const { data: current } = await supabase
    .from("documents")
    .select("shipment_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!current || current.shipment_id !== null) return;

  const identity = billIdentity(extraction);
  if (identity) {
    let shipmentId: string | null = null;
    if (identity.level === "house") {
      const { data: allShipments } = await supabase
        .from("shipments")
        .select("id, bl_number, house_bl_number, bill_level")
        .limit(500);
      let master = (allShipments ?? []).find((item) =>
        item.bill_level === "master" &&
        normalizeBillNumber(item.bl_number) === identity.masterBlNumber
      );
      if (!master) {
        const { data } = await supabase.from("shipments").insert({
          owner: ownerId,
          bl_number: identity.masterBlNumber,
          bill_level: "master",
        }).select("id, bl_number, house_bl_number, bill_level").single();
        master = data ?? undefined;
        if (master) await announceShipmentCreated(ownerId, master.id, identity.masterBlNumber, "master");
      }
      let house = (allShipments ?? []).find((item) =>
        item.bill_level === "house" &&
        normalizeBillNumber(item.house_bl_number) === identity.houseBlNumber
      );
      if (!house && master) {
        const { data } = await supabase.from("shipments").insert({
          owner: ownerId,
          bl_number: identity.houseBlNumber,
          house_bl_number: identity.houseBlNumber,
          bill_level: "house",
          master_shipment_id: master.id,
        }).select("id, bl_number, house_bl_number, bill_level").single();
        house = data ?? undefined;
        if (house) await announceShipmentCreated(ownerId, house.id, identity.houseBlNumber, "house");
      }
      shipmentId = house?.id ?? null;
    } else {
      const { data: existing } = await supabase
        .from("shipments")
        .select("id, bl_number")
        .limit(500);
      shipmentId = (existing ?? []).find((item) =>
        normalizeBillNumber(item.bl_number) === identity.blNumber
      )?.id ?? null;
      if (!shipmentId) {
        const { data: created } = await supabase.from("shipments").insert({
          owner: ownerId,
          bl_number: identity.blNumber,
          bill_level: identity.level,
        }).select("id").single();
        shipmentId = created?.id ?? null;
        if (shipmentId) await announceShipmentCreated(ownerId, shipmentId, identity.blNumber, identity.level);
      } else if (identity.level === "master") {
        await supabase.from("shipments").update({ bill_level: "master" }).eq("id", shipmentId);
      }
    }
    if (shipmentId) {
      await supabase.from("documents").update({ shipment_id: shipmentId }).eq("id", documentId);
    }
    return;
  }

  const [{ data: shipments }, { data: docs }] = await Promise.all([
    supabase.from("shipments").select("id, bl_number, ref").limit(200),
    supabase
      .from("documents")
      .select(
        "id, shipment_id, doc_type, fields, invoice_no:fields->>invoice_no, invoice_ref:fields->>invoice_ref"
      )
      .neq("id", documentId)
      .limit(500),
  ]);

  const decision = decideLink(
    extraction,
    shipments ?? [],
    (docs ?? []) as unknown as DocCandidate[]
  );

  let shipmentId: string | null = null;
  if (decision.action === "attach") {
    shipmentId = decision.shipmentId;
  } else if (decision.action === "create") {
    const { data: created } = await supabase
      .from("shipments")
      .insert({ owner: ownerId, bl_number: decision.bl_number })
      .select("id")
      .single();
    shipmentId = created?.id ?? null;
    if (shipmentId) await announceShipmentCreated(ownerId, shipmentId, decision.bl_number, "standalone");
  } else if (decision.action === "create_ref") {
    const { data: created } = await supabase
      .from("shipments")
      .insert({ owner: ownerId, ref: decision.ref })
      .select("id")
      .single();
    shipmentId = created?.id ?? null;
    if (shipmentId) await announceShipmentCreated(ownerId, shipmentId, decision.ref, "standalone");
  }
  if (shipmentId) {
    await supabase
      .from("documents")
      .update({ shipment_id: shipmentId })
      .eq("id", documentId);
    await supabase.from("events").insert({
      owner: ownerId,
      type: "document_grouped",
      payload: { document_id: documentId, shipment_id: shipmentId, decision: decision.action },
    });
  }
}

export async function persistResult(
  supabase: SupabaseClient,
  ownerId: string,
  documentId: string,
  result: Awaited<ReturnType<typeof parseDocument>>,
  validation: ValidationResult[]
): Promise<ValidationResult[]> {
  const { extraction } = result;

  const dup = await duplicateWarn(supabase, ownerId, documentId, extraction);
  if (dup) validation = [...validation, dup];

  await supabase
    .from("documents")
    .update({
      status: "parsed",
      doc_type: extraction.detected_type,
      fields: extraction.fields,
      raw_extraction: {
        text: result.rawText.slice(0, 100_000),
        model: result.model,
        provider: result.provider,
        prompt_version: result.promptVersion,
        escalated: result.escalated,
        quality_score: result.qualityScore,
      },
      validation,
    })
    .eq("id", documentId);

  const containers = containersOf(extraction);
  await supabase.from("containers").delete().eq("document_id", documentId);
  if (containers.length > 0) {
    await supabase.from("containers").insert(
      containers.map((c) => ({
        document_id: documentId,
        owner: ownerId,
        container_no: c.container_no,
        seal_no: c.seal_no,
        iso_type: c.iso_type,
        packages: c.packages,
        package_type: c.package_type,
        gross_kg: c.gross_kg,
        volume_cbm: c.volume_cbm,
        check_digit_valid: c.container_no
          ? containerCheckDigit(c.container_no)
          : null,
      }))
    );
  }

  await autoLink(supabase, ownerId, documentId, extraction);
  await syncExtractedChargeAlert(supabase, ownerId, documentId, extraction);

  const fields = extraction.fields as unknown as { line_items?: Array<Record<string, unknown>> };
  const reviews = (fields.line_items ?? []).flatMap((line, lineIndex) => {
    const code = typeof line.hs_code_suggestion === "string" ? line.hs_code_suggestion : "";
    const confidence = typeof line.hs_suggestion_confidence === "string" ? line.hs_suggestion_confidence : "";
    if (!/^\d{6}$/.test(code) || !["low", "medium", "high"].includes(confidence)) return [];
    return [{
      owner: ownerId,
      document_id: documentId,
      line_index: lineIndex,
      product_description: typeof line.description === "string" ? line.description : null,
      suggested_code: code,
      confidence,
      reason: typeof line.hs_suggestion_reason === "string" ? line.hs_suggestion_reason : null,
      duty_rate: typeof line.us_general_duty_rate === "string" ? line.us_general_duty_rate : null,
    }];
  });
  if (reviews.length) {
    await supabase.from("hs_reviews").upsert(reviews, {
      onConflict: "document_id,line_index",
      ignoreDuplicates: true,
    });
  }

  await supabase.from("events").insert({
    owner: ownerId,
    type: "parse_done",
    payload: {
      document_id: documentId,
      detected_type: extraction.detected_type,
      model: result.model,
      provider: result.provider,
      escalated: result.escalated,
      prompt_version: result.promptVersion,
      quality_score: result.qualityScore,
      validation_fail_count: validation.filter((v) => v.status === "fail").length,
    },
  });

  await emitWebhook(ownerId, "document.parsed", {
    document_id: documentId,
    document_type: extraction.detected_type,
    quality_score: result.qualityScore,
    validation_fail_count: validation.filter((v) => v.status === "fail").length,
  });

  return validation;
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const reference = publicReference(requestId);
  const requestStartedAt = Date.now();
  const reject = (reason: string, message: string, status = 400) => {
    logWarn("parse_request_rejected", {
      requestId,
      reference,
      reason,
      status,
      durationMs: Date.now() - requestStartedAt,
    });
    return Response.json(
      { error: message, reference },
      { status, headers: { "X-Request-ID": requestId } }
    );
  };
  if (!process.env.OPENROUTER_API_KEY) {
    return reject(
      "parser_not_configured",
      "Document reading is temporarily unavailable. Please try again later.",
      503
    );
  }

  let body: { pages?: unknown; docTypeHint?: unknown; docId?: unknown; targetLanguage?: unknown };
  try {
    body = await request.json();
  } catch {
    return reject("invalid_json", "The document request could not be read.");
  }

  const pages = Array.isArray(body.pages) ? (body.pages as PageRef[]) : [];
  if (pages.length < 1 || pages.length > MAX_PAGES) {
    return reject("invalid_page_count", `Add between 1 and ${MAX_PAGES} pages.`);
  }
  const inlineDataLength = pages.reduce(
    (sum, page) => sum + (typeof page?.dataUrl === "string" ? page.dataUrl.length : 0),
    0
  );
  if (inlineDataLength > ANON_MAX_TOTAL_DATAURL) {
    return reject(
      "inline_payload_too_large",
      "These pages could not be prepared automatically as one request. Try fewer pages, or sign in to upload them directly."
    );
  }

  const docTypeHint =
    typeof body.docTypeHint === "string" &&
    DETECTED_TYPES.includes(body.docTypeHint as (typeof DETECTED_TYPES)[number])
      ? body.docTypeHint
      : undefined;

  const docId = typeof body.docId === "string" ? body.docId : undefined;
  const targetLanguage = isTranslationLanguage(body.targetLanguage) ? body.targetLanguage : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve every page to a fetchable URL.
  const imageUrls: string[] = [];
  for (const page of pages) {
    if (typeof page?.storagePath === "string") {
      if (!user) return reject("auth_required", "Sign in to parse uploaded documents.", 401);
      if (!page.storagePath.startsWith(`${user.id}/`)) {
        return reject("storage_scope_denied", "This uploaded page is not available to your account.", 403);
      }
      const { data, error } = await supabase.storage
        .from("docs")
        .createSignedUrl(page.storagePath, 3600);
      if (error || !data?.signedUrl) {
        return reject("storage_sign_failed", "An uploaded page could not be opened. Please upload it again.");
      }
      imageUrls.push(data.signedUrl);
    } else if (
      typeof page?.url === "string" &&
      /^https:\/\/.{4,2000}$/.test(page.url)
    ) {
      imageUrls.push(page.url);
    } else if (
      typeof page?.dataUrl === "string" &&
      /^data:image\/(jpeg|png|webp);base64,/.test(page.dataUrl)
    ) {
      // Anonymous scan flow: no storage access, so compressed pages travel
      // inline. The client quality-optimizes unusually large pages; signed-in
      // uploads still go direct to storage.
      if (page.dataUrl.length > ANON_MAX_DATAURL) {
        return reject(
          "inline_page_too_large",
          "This page could not be prepared automatically. Try a standard JPG or PDF, or sign in to upload it directly."
        );
      }
      if (pages.length > ANON_MAX_PAGES) {
        return reject(
          "anonymous_page_limit",
          `Guest parsing is limited to ${ANON_MAX_PAGES} pages. Sign in to process more.`
        );
      }
      imageUrls.push(page.dataUrl);
    } else {
      return reject("invalid_page_reference", "One of the document pages could not be read.");
    }
  }

  const guestQuota = user
    ? null
    : await consumeGuestDocument(request.headers.get("cookie"));
  if (guestQuota && !guestQuota.allowed) {
    return reject(
      "anonymous_daily_limit",
      `You've used today's ${GUEST_DAILY_DOCUMENT_LIMIT} free guest documents. Sign in to continue, or come back tomorrow.`,
      429
    );
  }

  if (user) {
    const usage = await getUsageContext(user.id);
    if (usage.used >= usage.limit) {
      return reject(
        "monthly_plan_limit",
        `You've reached your ${usage.limit}-document monthly allowance.`,
        429
      );
    }
  }

  logInfo("parse_request_accepted", {
    requestId,
    reference,
    pageCount: pages.length,
    signedIn: Boolean(user),
    inputMode: pages.some((page) => typeof page.dataUrl === "string")
      ? "inline"
      : pages.some((page) => typeof page.storagePath === "string")
        ? "private_storage"
        : "remote_url",
    docTypeHint,
  });

  // Authenticated users get a documents row (created or reused via docId).
  let documentId: string | null = null;
  if (user) {
    if (docId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("id")
        .eq("id", docId)
        .maybeSingle();
      if (!doc) return reject("document_not_found", "This document could not be found.", 404);
      documentId = doc.id as string;
      await supabase
        .from("documents")
        .update({ status: "parsing", page_count: pages.length })
        .eq("id", documentId);
    } else {
      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          owner: user.id,
          doc_type: docTypeHint ?? "other",
          status: "parsing",
          page_count: pages.length,
          storage_path:
            typeof pages[0]?.storagePath === "string"
              ? pages[0].storagePath.split("/").slice(0, 2).join("/")
              : null,
        })
        .select("id")
        .single();
      if (error || !doc) {
        logError("parse_document_create_failed", error, { requestId, reference });
        return reject(
          "document_create_failed",
          "We couldn't prepare this document. Please try again.",
          500
        );
      }
      documentId = doc.id as string;
      await emitWebhook(user.id, "document.received", {
        document_id: documentId,
        source: "upload",
        source_filename: null,
        shipment_id: null,
      });
    }
  }

  // Fires for both branches above — a re-parse of an existing document is still
  // a parse starting, and a receiver tracking progress needs to see it.
  // `user` is only non-null on the persisted path; an anonymous trial parse has
  // no account to deliver events to.
  if (documentId && user) {
    await emitWebhook(user.id, "document.parsing_started", {
      document_id: documentId,
      document_type: docTypeHint ?? "other",
      page_count: pages.length,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      send("status", { state: "parsing", documentId, pages: pages.length });
      const processingDocumentIds: string[] = documentId ? [documentId] : [];
      try {
        let groups: LogicalPageGroup[] = [{ pages: imageUrls.map((_, index) => index + 1), detectedType: (docTypeHint as DetectedType | undefined) ?? "other", documentKey: null }];
        if (user && documentId && imageUrls.length > 1) {
          send("status", { state: "Classifying pages into logical documents" });
          try {
            const classified = await classifyPageGroups(imageUrls);
            if (classified.length > 0 && classified.length <= 8) groups = classified;
          } catch (classificationError) {
            logWarn("logical_document_classification_failed", { requestId, reference, message: classificationError instanceof Error ? classificationError.message : String(classificationError) });
          }
        }
        if (user && documentId && groups.length > 1) {
          const storagePath = typeof pages[0]?.storagePath === "string" ? pages[0].storagePath.split("/").slice(0, 2).join("/") : null;
          await supabase.from("documents").update({ source_pages: groups[0].pages, logical_group_index: 1, logical_group_count: groups.length }).eq("id", documentId);
          const { data: childRows, error: childError } = await supabase.from("documents").insert(groups.slice(1).map((group, index) => ({
            owner: user.id, doc_type: group.detectedType, status: "parsing", page_count: group.pages.length,
            storage_path: storagePath, source_pages: group.pages, source_document_id: documentId,
            logical_group_index: index + 2, logical_group_count: groups.length, logical_child: true,
          }))).select("id, logical_group_index").order("logical_group_index");
          if (childError || (childRows ?? []).length !== groups.length - 1) throw new Error("Could not create logical document records");
          processingDocumentIds.push(...(childRows ?? []).map((row) => row.id as string));
          await supabase.from("events").insert({ owner: user.id, type: "mixed_file_split", payload: { source_document_id: documentId, groups: groups.map((group, index) => ({ document_id: processingDocumentIds[index], pages: group.pages, detected_type: group.detectedType, document_key: group.documentKey })) } });
          send("status", { state: `Split into ${groups.length} logical documents` });
        }
        const primaryGroup = groups[0];
        const result = await parseDocument(primaryGroup.pages.map((page) => imageUrls[page - 1]), primaryGroup.detectedType !== "other" ? primaryGroup.detectedType : docTypeHint, {
          onPartial: (partial) => send("fields", partial),
          onStatus: (status) =>
            send("status", {
              state: PUBLIC_PARSE_STATUS[status] ?? "Continuing document processing",
            }),
          requestId,
        });
        if (targetLanguage) {
          send("status", { state: "Translating extracted fields" });
          try {
            await translateExtraction(result.extraction, targetLanguage);
          } catch (translationError) {
            logWarn("parse_translation_failed", {
              requestId,
              reference,
              targetLanguage,
              message: translationError instanceof Error ? translationError.message : String(translationError),
            });
          }
        }
        send("status", { state: "Checking line-item HS code suggestions" });
        await addHsSuggestions(result.extraction);

        // Deterministic validation (spec §M3 step 3 / §M5) — server-side,
        // anonymous parses included; the duplicate check needs an owner.
        send("status", { state: "validating" });
        let validation = validateDocument(result.extraction);

        if (user && documentId) {
          validation = await persistResult(
            supabase,
            user.id,
            documentId,
            result,
            validation
          );
        }

        const logicalDocuments: Array<{ documentId: string | null; detectedType: string; pages: number[] }> = [{ documentId, detectedType: result.extraction.detected_type, pages: primaryGroup.pages }];
        if (user && groups.length > 1) {
          send("status", { state: `Extracting ${groups.length - 1} additional logical documents` });
          const additional = await Promise.all(groups.slice(1).map(async (group, offset) => {
            const logicalId = processingDocumentIds[offset + 1];
            const parsed = await parseDocument(group.pages.map((page) => imageUrls[page - 1]), group.detectedType !== "other" ? group.detectedType : undefined, { requestId });
            if (targetLanguage) {
              try { await translateExtraction(parsed.extraction, targetLanguage); } catch { /* Original legal text remains available when assistance fails. */ }
            }
            await addHsSuggestions(parsed.extraction);
            const logicalValidation = validateDocument(parsed.extraction);
            await persistResult(supabase, user.id, logicalId, parsed, logicalValidation);
            return { documentId: logicalId, detectedType: parsed.extraction.detected_type, pages: group.pages };
          }));
          logicalDocuments.push(...additional);
        }

        send("done", {
          documentId,
          logicalDocuments,
          extraction: result.extraction,
          validation,
          escalated: result.escalated,
          qualityScore: result.qualityScore,
        });
        logInfo("parse_request_succeeded", {
          requestId,
          reference,
          documentId,
          signedIn: Boolean(user),
          pageCount: pages.length,
          logicalDocumentCount: logicalDocuments.length,
          detectedType: result.extraction.detected_type,
          escalated: result.escalated,
          qualityScore: result.qualityScore,
          durationMs: Date.now() - requestStartedAt,
        });
      } catch (error) {
        logError("parse_request_failed", error, {
          requestId,
          reference,
          documentId,
          signedIn: Boolean(user),
          pageCount: pages.length,
          durationMs: Date.now() - requestStartedAt,
        });
        if (user && documentId) {
          await supabase
            .from("documents")
            .update({ status: "failed" })
            .in("id", processingDocumentIds);
          await emitWebhook(user.id, "document.failed", { document_id: documentId, reference });
        }
        send("error", {
          message:
            "We couldn't finish reading this document. Please try again. If the problem continues, share the reference with support.",
          reference,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Request-ID": requestId,
      ...(guestQuota
        ? {
            "Set-Cookie": guestQuota.setCookie ?? "",
            "X-Guest-Remaining": String(guestQuota.remaining),
          }
        : {}),
    },
  });
}
