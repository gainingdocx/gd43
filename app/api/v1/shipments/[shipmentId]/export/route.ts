// GET /v1/shipments/{id}/export?profile=… — the file a receiving system imports.
//
// This is the endpoint that makes "works with your TMS" true before any native
// connector exists: fetch the reviewed shipment already shaped for CargoWise,
// Tally or an accounting system, and hand it to whatever route already reaches
// that system.
//
// Returns the file itself, not a JSON envelope around it, so `curl -o` and an
// SFTP script both do the obvious thing.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, preflight, requestId } from "@/lib/api/respond";
import { badRequest, notFound, serverError } from "@/lib/api/errors";
import { pathSegment, requireEnum } from "@/lib/api/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalShipment, type DiscrepancyInput, type DocumentInput, type ShipmentInput } from "@/lib/integrations/canonical";
import { EXPORT_PROFILES, renderProfile, type ExportProfile } from "@/lib/integrations/profiles";

export const OPTIONS = preflight;

export const GET = handler(async (request) => {
  const caller = await authenticate(request);
  // .../shipments/{id}/export
  const shipmentId = pathSegment(request, 1);
  const url = new URL(request.url);
  const profile = requireEnum<ExportProfile>(url.searchParams.get("profile"), "profile", EXPORT_PROFILES, "canonical_json");
  const admin = createAdminClient();

  const { data: shipment, error } = await admin
    .from("shipments")
    .select("id, ref, bl_number, house_bl_number, bill_level, master_shipment_id, created_at")
    .eq("id", shipmentId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (error) throw serverError("The shipment could not be exported.");
  if (!shipment) throw notFound(`No shipment with id '${shipmentId}'.`, "shipment_not_found");

  const [{ data: documents }, { data: discrepancies }] = await Promise.all([
    admin
      .from("documents")
      .select("id, doc_type, status, source_filename, page_count, fields, created_at, updated_at")
      .eq("shipment_id", shipmentId)
      .eq("owner", caller.owner)
      .eq("status", "parsed")
      .order("created_at", { ascending: true }),
    admin
      .from("discrepancies")
      .select("id, severity, field, message, value_a, value_b, doc_a, doc_b, questioned_amount, questioned_currency, resolved, resolution_status, resolution_note")
      .eq("shipment_id", shipmentId)
      .eq("owner", caller.owner),
  ]);

  if ((documents ?? []).length === 0) {
    throw badRequest("This shipment has no parsed documents to export.", "shipment_id", "no_parsed_documents");
  }

  const canonical = canonicalShipment(
    shipment as ShipmentInput,
    (documents ?? []) as DocumentInput[],
    (discrepancies ?? []) as DiscrepancyInput[]
  );

  // Accounting profiles create a payable. Refusing outright — rather than
  // exporting with a warning nobody reads — is the whole point of the product:
  // an invoice with an unresolved critical discrepancy must not reach a ledger.
  const isBill = profile === "quickbooks_bill" || profile === "xero_bill" || profile === "zoho_books_bill" || profile === "tally_xml";
  if (isBill && !canonical.summary.clear_for_write_back) {
    throw badRequest(
      `This shipment has ${canonical.summary.open_critical} unresolved critical discrepancy(ies). ` +
        "Resolve them before exporting a bill payload.",
      "profile",
      "critical_discrepancies_open"
    );
  }

  const output = renderProfile(profile, canonical);
  const reference = (shipment.ref ?? shipment.bl_number ?? shipment.id.slice(0, 8)).replace(/[^A-Za-z0-9_-]/g, "-");

  return new Response(output.body, {
    status: 200,
    headers: {
      "Content-Type": output.mime,
      "Content-Disposition": `attachment; filename="${reference}-${profile}.${output.extension}"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "X-Request-Id": requestId(),
      // The caveat travels with the file, so it is still attached when the file
      // is forwarded to whoever actually runs the import.
      "X-GainingDocx-Notice": output.notice,
      ...rateHeaders(caller),
    },
  });
});
