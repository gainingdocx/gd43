import { addHsSuggestions } from "@/lib/ai/hs-classifier";
import { MAX_PAGES } from "@/lib/ai/config";
import { parseDocument } from "@/lib/ai/router";
import { DETECTED_TYPES } from "@/lib/ai/schemas/extraction-v2";
import { sha256 } from "@/lib/integrations/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDocument } from "@/lib/validators";
import { persistResult } from "@/app/api/parse/route";
import { isTranslationLanguage } from "@/lib/ai/languages";
import { translateExtraction } from "@/lib/ai/translate";

export const maxDuration = 120;

type Page = { url?: unknown; data_url?: unknown };

function apiError(message: string, status: number, code: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token.startsWith("gdx_live_") || token.length < 30) {
    return apiError("Use a valid Bearer API key.", 401, "invalid_api_key");
  }

  const admin = createAdminClient();
  const tokenHash = await sha256(token);
  const { data: apiKey } = await admin
    .from("api_keys")
    .select("id, owner, revoked_at")
    .eq("key_hash", tokenHash)
    .maybeSingle();
  if (!apiKey || apiKey.revoked_at) return apiError("This API key is invalid or revoked.", 401, "invalid_api_key");

  let body: { pages?: unknown; document_type?: unknown; shipment_id?: unknown; source_filename?: unknown; target_language?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400, "invalid_json");
  }
  const pages = Array.isArray(body.pages) ? body.pages as Page[] : [];
  if (!pages.length || pages.length > MAX_PAGES) {
    return apiError(`pages must contain 1 to ${MAX_PAGES} page references.`, 400, "invalid_pages");
  }
  const imageUrls: string[] = [];
  for (const page of pages) {
    const value = typeof page.url === "string" ? page.url : page.data_url;
    if (typeof value !== "string" ||
      (!/^https:\/\/.{4,2000}$/.test(value) && !/^data:image\/(jpeg|png|webp);base64,/.test(value))) {
      return apiError("Each page needs an HTTPS url or image data_url.", 400, "invalid_page");
    }
    if (value.length > 10_000_000) return apiError("An inline page exceeds the 10 MB encoded limit.", 413, "page_too_large");
    imageUrls.push(value);
  }
  const hint = typeof body.document_type === "string" &&
    DETECTED_TYPES.includes(body.document_type as (typeof DETECTED_TYPES)[number])
    ? body.document_type as (typeof DETECTED_TYPES)[number]
    : undefined;
  const shipmentId = typeof body.shipment_id === "string" ? body.shipment_id : null;
  if (shipmentId) {
    const { data: shipment } = await admin.from("shipments").select("id").eq("id", shipmentId).eq("owner", apiKey.owner).maybeSingle();
    if (!shipment) return apiError("shipment_id was not found for this account.", 404, "shipment_not_found");
  }

  const { data: document, error: createError } = await admin.from("documents").insert({
    owner: apiKey.owner,
    shipment_id: shipmentId,
    status: "parsing",
    doc_type: hint ?? "other",
    page_count: pages.length,
    source_filename: typeof body.source_filename === "string" ? body.source_filename.slice(0, 240) : null,
  }).select("id").single();
  if (createError || !document) return apiError("The document record could not be created.", 500, "document_create_failed");

  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);
  try {
    const result = await parseDocument(imageUrls, hint);
    if (isTranslationLanguage(body.target_language)) {
      await translateExtraction(result.extraction, body.target_language);
    }
    await addHsSuggestions(result.extraction);
    const validation = await persistResult(
      admin,
      apiKey.owner,
      document.id,
      result,
      validateDocument(result.extraction),
    );
    return Response.json({
      id: document.id,
      object: "document",
      status: "parsed",
      document_type: result.extraction.detected_type,
      fields: result.extraction.fields,
      validation,
      quality_score: result.qualityScore,
    }, { headers: { "X-GainingDocx-Document-ID": document.id } });
  } catch {
    await admin.from("documents").update({ status: "failed" }).eq("id", document.id);
    return apiError("Parsing failed. Retry the same source as a new request.", 502, "parse_failed");
  }
}
