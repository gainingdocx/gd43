// POST /v1/discrepancies/{id}/resolve — close a finding.
//
// The counterpart to `discrepancy.created`: a system that receives findings
// should be able to close them too, otherwise every exception queue built on
// this API is read-only and a person still has to finish in the browser.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { notFound } from "@/lib/api/errors";
import { pathSegment, requireEnum } from "@/lib/api/validate";
import { resolveDiscrepancy } from "@/lib/workflow/operations";

const STATUSES = ["resolved", "dismissed", "corrected", "accepted"] as const;

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../discrepancies/{id}/resolve
  const discrepancyId = pathSegment(request, 1);
  const body = await readJson<{ status?: unknown; note?: unknown; resolved_by?: unknown }>(request).catch(() => ({}) as { status?: unknown; note?: unknown; resolved_by?: unknown });

  const result = await resolveDiscrepancy(caller.owner, discrepancyId, {
    status: requireEnum(body.status, "status", STATUSES, "resolved"),
    note: typeof body.note === "string" ? body.note.slice(0, 1000) : null,
    resolvedBy: typeof body.resolved_by === "string" ? body.resolved_by.slice(0, 120) : null,
  });

  if ("error" in result) throw notFound(`No discrepancy with id '${discrepancyId}'.`, "discrepancy_not_found");

  return json(
    { id: discrepancyId, object: "discrepancy" as const, resolved: true, shipment_id: result.shipmentId },
    { id, headers: rateHeaders(caller) }
  );
});
