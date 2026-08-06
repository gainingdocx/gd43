import { addHsSuggestions } from "@/lib/ai/hs-classifier";
import { MAX_PAGES } from "@/lib/ai/config";
import { parseDocument } from "@/lib/ai/router";
import { DETECTED_TYPES } from "@/lib/ai/schemas/extraction-v2";
import { emitWebhook } from "@/lib/integrations/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDocument } from "@/lib/validators";
import { persistResult } from "@/app/api/parse/route";
import { isTranslationLanguage } from "@/lib/ai/languages";
import { translateExtraction } from "@/lib/ai/translate";
import { authenticate, rateHeaders } from "@/lib/api/auth";
import { ApiError, badRequest, notFound, serverError } from "@/lib/api/errors";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { assertDocumentQuota, quotaHeaders } from "@/lib/api/quota";
import { serializeDocument } from "@/lib/api/serialize";

export const maxDuration = 120;

type Page = { url?: unknown; data_url?: unknown };

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // Documents parsed through the API draw on the same monthly allowance as the
  // web app. Checked before any AI work so a blocked request costs nothing.
  const quota = await assertDocumentQuota(caller.owner);
  const body = await readJson<{
    pages?: unknown;
    document_type?: unknown;
    shipment_id?: unknown;
    source_filename?: unknown;
    target_language?: unknown;
  }>(request);

  const pages = Array.isArray(body.pages) ? (body.pages as Page[]) : [];
  if (!pages.length || pages.length > MAX_PAGES) {
    throw badRequest(`\`pages\` must contain 1 to ${MAX_PAGES} page references.`, "pages", "invalid_pages");
  }

  const imageUrls: string[] = [];
  pages.forEach((page, index) => {
    const value = typeof page.url === "string" ? page.url : page.data_url;
    if (
      typeof value !== "string" ||
      (!/^https:\/\/.{4,2000}$/.test(value) && !/^data:image\/(jpeg|png|webp);base64,/.test(value))
    ) {
      throw badRequest(
        "Each page needs an HTTPS `url` or a base64 image `data_url`.",
        `pages[${index}]`,
        "invalid_page"
      );
    }
    if (value.length > 10_000_000) {
      throw new ApiError({
        type: "invalid_request_error",
        code: "page_too_large",
        message: "An inline page exceeds the 10 MB encoded limit. Host it and pass an HTTPS url instead.",
        param: `pages[${index}]`,
        status: 413,
      });
    }
    imageUrls.push(value);
  });

  const hint =
    typeof body.document_type === "string" &&
    DETECTED_TYPES.includes(body.document_type as (typeof DETECTED_TYPES)[number])
      ? (body.document_type as (typeof DETECTED_TYPES)[number])
      : undefined;

  const admin = createAdminClient();
  const shipmentId = typeof body.shipment_id === "string" ? body.shipment_id : null;
  if (shipmentId) {
    const { data: shipment } = await admin
      .from("shipments")
      .select("id")
      .eq("id", shipmentId)
      .eq("owner", caller.owner)
      .maybeSingle();
    if (!shipment) throw notFound("`shipment_id` was not found for this account.", "shipment_not_found");
  }

  const { data: document, error: createError } = await admin
    .from("documents")
    .insert({
      owner: caller.owner,
      shipment_id: shipmentId,
      status: "parsing",
      doc_type: hint ?? "other",
      page_count: pages.length,
      source_filename: typeof body.source_filename === "string" ? body.source_filename.slice(0, 240) : null,
    })
    .select("id, shipment_id, doc_type, status, page_count, source_filename, created_at, updated_at")
    .single();
  if (createError || !document) throw serverError("The document record could not be created.", "document_create_failed");

  // Both published events for the intake half of the pipeline. They fire before
  // any extraction work so a receiver can show "arrived, working on it" rather
  // than nothing until the parse finishes, which on a long document is minutes.
  await emitWebhook(caller.owner, "document.received", {
    document_id: document.id,
    source: "api",
    source_filename: document.source_filename,
    shipment_id: shipmentId,
  });
  await emitWebhook(caller.owner, "document.parsing_started", {
    document_id: document.id,
    document_type: hint ?? "other",
    page_count: pages.length,
  });

  try {
    const result = await parseDocument(imageUrls, hint);
    if (isTranslationLanguage(body.target_language)) {
      await translateExtraction(result.extraction, body.target_language);
    }
    await addHsSuggestions(result.extraction);
    const validation = await persistResult(
      admin,
      caller.owner,
      document.id,
      result,
      validateDocument(result.extraction)
    );

    return json(
      {
        ...serializeDocument({ ...document, status: "parsed", doc_type: result.extraction.detected_type }),
        document_type: result.extraction.detected_type,
        fields: result.extraction.fields,
        validation,
        quality_score: result.qualityScore,
      },
      {
        id,
        headers: {
          ...rateHeaders(caller),
          // Reflects state before this document; the caller can see how close
          // it is to the allowance without a second call.
          ...quotaHeaders(quota),
          "X-GainingDocx-Document-ID": document.id,
        },
      }
    );
  } catch (error) {
    // Leave a durable record of the failure so the document does not sit in
    // `parsing` forever, then surface a retryable error.
    await admin.from("documents").update({ status: "failed" }).eq("id", document.id);
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      type: "api_error",
      code: "parse_failed",
      message: "Parsing failed. Retry the same source as a new request.",
      status: 502,
    });
  }
});
