// POST /v1/documents/{id}/approve — sign off the extracted values.
//
// The event every write-back path waits for. Until this existed the API could
// read a document and parse a new one but could not move it through the
// workflow, which meant an integration had to send a person into the browser to
// finish the job it had started.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { ApiError, notFound } from "@/lib/api/errors";
import { pathSegment } from "@/lib/api/validate";
import { approveDocument } from "@/lib/workflow/operations";

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../documents/{id}/approve
  const documentId = pathSegment(request, 1);
  const body = await readJson<{ approved_by?: unknown }>(request).catch(() => ({}) as { approved_by?: unknown });

  const result = await approveDocument(caller.owner, documentId, {
    approvedBy: typeof body.approved_by === "string" ? body.approved_by.slice(0, 120) : null,
  });

  if ("error" in result) {
    if (result.error === "not_found") throw notFound(`No document with id '${documentId}'.`, "document_not_found");
    if (result.error === "not_parsed") {
      throw new ApiError({
        type: "invalid_request_error",
        code: "document_not_parsed",
        message: "Only a parsed document can be approved.",
        status: 409,
      });
    }
    // 409, not 400: the request is well formed and will succeed once the
    // discrepancies are resolved, so a client can retry the same call.
    throw new ApiError({
      type: "invalid_request_error",
      code: "critical_discrepancies_open",
      message:
        `This document's shipment has ${result.openCritical} unresolved critical discrepancy(ies). ` +
        "Resolve them before approving.",
      status: 409,
    });
  }

  return json({ ...result.document, object: "document" as const }, { id, headers: rateHeaders(caller) });
});
