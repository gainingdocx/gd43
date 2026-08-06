// POST /v1/documents/{id}/correct — overwrite extracted values a reviewer disputes.
//
// Body is `{ "fields": { "gross_weight_kg": 12480 } }`. Only keys already
// present in the extraction may be written: a correction says "the parser
// misread this printed value", and letting a caller invent keys would corrupt
// every downstream mapping while looking like a successful call.
//
// Correcting re-runs cross-document matching, because a changed value can
// resolve an old mismatch or create a new one.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { badRequest, notFound } from "@/lib/api/errors";
import { pathSegment } from "@/lib/api/validate";
import { correctDocument } from "@/lib/workflow/operations";

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../documents/{id}/correct
  const documentId = pathSegment(request, 1);
  const body = await readJson<{ fields?: unknown; corrected_by?: unknown }>(request);

  if (!body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) {
    throw badRequest("`fields` must be an object of field names to corrected values.", "fields");
  }

  const result = await correctDocument(caller.owner, documentId, body.fields as Record<string, unknown>, {
    correctedBy: typeof body.corrected_by === "string" ? body.corrected_by.slice(0, 120) : null,
  });

  if ("error" in result) {
    if (result.error === "not_found") throw notFound(`No document with id '${documentId}'.`, "document_not_found");
    if (result.error === "no_fields") throw badRequest("`fields` was empty.", "fields");
    throw badRequest(
      `Unknown field(s): ${result.unknown?.join(", ")}. A correction can only change values the parser already extracted.`,
      "fields",
      "unknown_field"
    );
  }

  return json(
    { ...result.document, object: "document" as const, corrected: result.changed },
    { id, headers: rateHeaders(caller) }
  );
});
