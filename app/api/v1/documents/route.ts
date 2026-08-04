// GET /v1/documents — list the calling account's documents.
//
// Filterable by status, document type and shipment, with offset pagination.
// Field data is omitted here and returned by the retrieve endpoint; a list of
// fifty parsed documents would otherwise be megabytes.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { pagination, requireEnum } from "@/lib/api/validate";
import { serializeDocument, type DocumentRow } from "@/lib/api/serialize";
import { serverError } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["uploaded", "parsing", "parsed", "failed"] as const;

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const url = new URL(request.url);
  const { limit, offset } = pagination(url);

  const admin = createAdminClient();
  let query = admin
    .from("documents")
    .select("id, shipment_id, doc_type, status, page_count, source_filename, created_at, updated_at", {
      count: "exact",
    })
    // Ownership is enforced here rather than by RLS because the admin client
    // bypasses RLS by design; the API key resolves to exactly one owner.
    .eq("owner", caller.owner)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", requireEnum(status, "status", STATUSES));

  const documentType = url.searchParams.get("document_type");
  if (documentType) query = query.eq("doc_type", documentType);

  const shipmentId = url.searchParams.get("shipment_id");
  if (shipmentId) query = query.eq("shipment_id", shipmentId);

  const { data, error, count } = await query;
  if (error) throw serverError("Documents could not be listed.");

  const rows = (data ?? []) as DocumentRow[];
  return json(
    list(rows.map((row) => serializeDocument(row)), {
      hasMore: count !== null && offset + rows.length < count,
      total: count ?? undefined,
    }),
    { id, headers: rateHeaders(caller) }
  );
});
