// POST /v1/webhooks/{id}/test — send a sample event to a destination.
//
// The first question after configuring a destination is "did that work", and
// waiting for a real shipment to answer it is a bad experience. The sample is a
// real delivery through the real pipeline — it appears in the delivery log and
// is signed identically — carrying obviously fake data marked `"test": true`.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { notFound } from "@/lib/api/errors";
import { pathSegment } from "@/lib/api/validate";
import { sendTestDelivery } from "@/lib/integrations/delivery";

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  // .../webhooks/{id}/test
  const webhookId = pathSegment(request, 1);

  const result = await sendTestDelivery(caller.owner, webhookId);
  if (!result) throw notFound(`No destination with id '${webhookId}'.`, "webhook_not_found");

  // A destination that rejects the test is not a failed API call — the request
  // did exactly what it was asked to. The result is the payload.
  return json(
    {
      object: "webhook_test",
      webhook_id: webhookId,
      delivered: result.delivered,
      response_status: result.status,
      error: result.error,
    },
    { id, headers: rateHeaders(caller) }
  );
});
