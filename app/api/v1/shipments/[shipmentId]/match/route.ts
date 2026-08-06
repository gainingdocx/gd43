// POST /v1/shipments/{id}/match — run cross-document matching now.
//
// Matching runs automatically when documents arrive together, but an
// integration that uploads a missing packing list an hour later needs to say
// "check it again" without waiting for another upload to trigger it.
//
// Synchronous: matching is deterministic arithmetic over already-extracted
// fields, not an AI call, so it returns in well under a second and a job
// handle would be more work for the caller than the wait it saves.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { notFound } from "@/lib/api/errors";
import { pathSegment } from "@/lib/api/validate";
import { matchShipment } from "@/lib/workflow/operations";

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../shipments/{id}/match
  const shipmentId = pathSegment(request, 1);

  const result = await matchShipment(caller.owner, shipmentId);
  if ("error" in result) throw notFound(`No shipment with id '${shipmentId}'.`, "shipment_not_found");

  return json(
    {
      object: "match_run" as const,
      shipment_id: shipmentId,
      documents_compared: result.documentsCompared,
      critical: result.critical,
      warnings: result.warnings,
      // Only mismatches that were not already open. A re-run of an unchanged
      // shipment reports zero here even though `critical` is unchanged.
      newly_created: result.created,
      clear_for_write_back: result.critical === 0,
    },
    { id, headers: rateHeaders(caller) }
  );
});
