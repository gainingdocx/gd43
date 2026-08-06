// POST /v1/deliveries/{id}/replay — send a past delivery again.
//
// Addressed by delivery rather than by destination because that is how the
// problem presents: an endpoint was down between 02:00 and 04:00, and the
// customer wants those specific events back. The replay carries the original
// body, so the receiver gets the event as it was, not a fresh snapshot of a
// shipment that has moved on since.
//
// The original delivery's failed attempts stay on the record.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { notFound } from "@/lib/api/errors";
import { pathSegment } from "@/lib/api/validate";
import { replayDelivery } from "@/lib/integrations/delivery";

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../deliveries/{id}/replay
  const deliveryId = pathSegment(request, 1);

  const replay = await replayDelivery(caller.owner, deliveryId);
  if (!replay) throw notFound(`No delivery with id '${deliveryId}'.`, "delivery_not_found");

  return json(
    { object: "webhook_delivery", id: replay.id, replay_of: deliveryId, status: "queued" },
    { id, status: 202, headers: rateHeaders(caller) }
  );
});
