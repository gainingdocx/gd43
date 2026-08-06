// GET /v1/shipments/{id} — retrieve one shipment in the canonical model.
//
// Returns the shipment as an integration needs it: parties, locations,
// containers and every document mapped to stable canonical names, plus the open
// discrepancies and the single `clear_for_write_back` flag a connector checks
// before it writes anything into a customer's system.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { notFound, serverError } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { pathSegment } from "@/lib/api/validate";
import { canonicalShipment, type DiscrepancyInput, type DocumentInput, type ShipmentInput } from "@/lib/integrations/canonical";

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const shipmentId = pathSegment(request);
  const admin = createAdminClient();

  // Scoped by owner, so another account's id reads as not found rather than
  // forbidden — confirming an id exists elsewhere is itself a disclosure.
  const { data: shipment, error } = await admin
    .from("shipments")
    .select("id, ref, bl_number, house_bl_number, bill_level, master_shipment_id, created_at")
    .eq("id", shipmentId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (error) throw serverError("The shipment could not be retrieved.");
  if (!shipment) throw notFound(`No shipment with id '${shipmentId}'.`, "shipment_not_found");

  const [{ data: documents }, { data: discrepancies }] = await Promise.all([
    admin
      .from("documents")
      .select("id, doc_type, status, source_filename, page_count, fields, created_at, updated_at")
      .eq("shipment_id", shipmentId)
      .eq("owner", caller.owner)
      .order("created_at", { ascending: true }),
    admin
      .from("discrepancies")
      .select("id, severity, field, message, value_a, value_b, doc_a, doc_b, questioned_amount, questioned_currency, resolved, resolution_status, resolution_note")
      .eq("shipment_id", shipmentId)
      .eq("owner", caller.owner)
      .order("severity", { ascending: true }),
  ]);

  return json(
    canonicalShipment(
      shipment as ShipmentInput,
      (documents ?? []) as DocumentInput[],
      (discrepancies ?? []) as DiscrepancyInput[]
    ),
    { id, headers: rateHeaders(caller) }
  );
});
