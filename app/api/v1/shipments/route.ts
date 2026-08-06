// GET /v1/shipments — list the calling account's shipments.
//
// The audit's finding was that the public API could parse a document but could
// not answer "what is the state of this shipment", which is the question an
// operational integration actually asks. This is the entry point to that.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { pagination } from "@/lib/api/validate";
import { serializeShipment, type ShipmentRow } from "@/lib/api/serialize";
import { serverError } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const url = new URL(request.url);
  const { limit, offset } = pagination(url);

  const admin = createAdminClient();
  let query = admin
    .from("shipments")
    .select("id, ref, bl_number, house_bl_number, bill_level, master_shipment_id, export_approval_required, created_at", {
      count: "exact",
    })
    .eq("owner", caller.owner)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Looking a shipment up by the reference printed on a document is how an
  // external system finds its counterpart here, so both identifiers filter.
  const reference = url.searchParams.get("reference");
  if (reference) query = query.eq("ref", reference);
  const blNumber = url.searchParams.get("bl_number");
  if (blNumber) query = query.eq("bl_number", blNumber);

  const { data, error, count } = await query;
  if (error) throw serverError("Shipments could not be listed.");

  const rows = (data ?? []) as ShipmentRow[];
  // Counts come from two grouped queries rather than N per-row queries: a page
  // of 25 shipments would otherwise be 50 round trips.
  const ids = rows.map((row) => row.id);
  const [{ data: documents }, { data: open }] = await Promise.all([
    ids.length > 0
      ? admin.from("documents").select("shipment_id").in("shipment_id", ids)
      : Promise.resolve({ data: [] as Array<{ shipment_id: string | null }> }),
    ids.length > 0
      ? admin.from("discrepancies").select("shipment_id, severity").in("shipment_id", ids).eq("resolved", false)
      : Promise.resolve({ data: [] as Array<{ shipment_id: string; severity: string }> }),
  ]);

  const documentCounts = new Map<string, number>();
  for (const row of documents ?? []) {
    if (row.shipment_id) documentCounts.set(row.shipment_id, (documentCounts.get(row.shipment_id) ?? 0) + 1);
  }
  const criticalCounts = new Map<string, number>();
  const warningCounts = new Map<string, number>();
  for (const row of open ?? []) {
    const target = row.severity === "red" ? criticalCounts : warningCounts;
    target.set(row.shipment_id, (target.get(row.shipment_id) ?? 0) + 1);
  }

  return json(
    list(
      rows.map((row) =>
        serializeShipment(row, {
          documentCount: documentCounts.get(row.id) ?? 0,
          openCritical: criticalCounts.get(row.id) ?? 0,
          openWarnings: warningCounts.get(row.id) ?? 0,
        })
      ),
      { hasMore: count !== null && offset + rows.length < count, total: count ?? undefined }
    ),
    { id, headers: rateHeaders(caller) }
  );
});
