// GET /v1/documents/{id}    — retrieve one document with its extracted fields
// DELETE /v1/documents/{id} — permanently delete it
//
// Both scope the query by the key's owner, so an id belonging to another
// account is reported as not found rather than forbidden: confirming that an id
// exists elsewhere would itself leak information.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { notFound, serverError } from "@/lib/api/errors";
import { serializeDocument, type DocumentRow } from "@/lib/api/serialize";
import { createAdminClient } from "@/lib/supabase/admin";

const SELECT =
  "id, shipment_id, doc_type, status, page_count, source_filename, fields, validation, created_at, updated_at";

function documentIdFrom(request: Request): string {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1] ?? "");
}

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const documentId = documentIdFrom(request);

  const { data, error } = await createAdminClient()
    .from("documents")
    .select(SELECT)
    .eq("id", documentId)
    .eq("owner", caller.owner)
    .maybeSingle();

  if (error) throw serverError("The document could not be retrieved.");
  if (!data) throw notFound(`No document with id '${documentId}'.`, "document_not_found");

  return json(serializeDocument(data as DocumentRow, { expand: true }), {
    id,
    headers: rateHeaders(caller),
  });
});

export const DELETE = handler(async (request, id) => {
  const caller = await authenticate(request);
  const documentId = documentIdFrom(request);

  // Select first so a missing id is a clean 404 rather than a silent no-op that
  // reports success for something that never existed.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (!existing) throw notFound(`No document with id '${documentId}'.`, "document_not_found");

  const { error } = await admin.from("documents").delete().eq("id", documentId).eq("owner", caller.owner);
  if (error) throw serverError("The document could not be deleted.");

  return json({ id: documentId, object: "document", deleted: true }, { id, headers: rateHeaders(caller) });
});
