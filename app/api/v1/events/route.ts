// GET /v1/events — the event catalogue.
//
// Published so a developer can discover what they can subscribe to without
// reading marketing pages, and so a client can validate an `events` array
// before creating a destination. Includes the retry schedule and the signature
// recipe, because those are the two things every webhook integration has to get
// right and the two most often left undocumented.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { INTEGRATION_EVENTS, CRITICAL_EVENT_TYPES } from "@/lib/integrations/events";
import { MAX_ATTEMPTS } from "@/lib/integrations/delivery";

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);

  return json(
    {
      ...list(
        INTEGRATION_EVENTS.map((event) => ({
          object: "event_type" as const,
          type: event.type,
          summary: event.summary,
          fires: event.fires,
          critical: CRITICAL_EVENT_TYPES.includes(event.type),
          // Field-name → type map rather than full JSON Schema: it is what a
          // developer actually reads, and a schema that drifts from the sender
          // is worse than none.
          data: event.data,
        })),
        { total: INTEGRATION_EVENTS.length }
      ),
      delivery: {
        transport: "HTTPS POST with a JSON body: { id, type, created_at, data }.",
        signature:
          "X-GainingDocx-Signature: sha256=<hex HMAC-SHA256 of the raw request body, keyed with your destination's signing secret>. " +
          "Compare it against the raw bytes before parsing, and use a constant-time comparison.",
        idempotency:
          "Idempotency-Key is stable across every attempt of one event. Record it and ignore a key you have already processed — " +
          "a receiver that times out after committing will see the same event again.",
        retries: `Up to ${MAX_ATTEMPTS} attempts over about seven hours (1m, 5m, 15m, 1h, 6h). ` +
          "A 4xx other than 408 or 429 stops retries immediately, because repeating a rejected request will not change the answer.",
        dead_letter:
          "After the final attempt the delivery is marked `dead` and an `integration.delivery_failed` event is sent to your other destinations. " +
          "Replay it with POST /v1/deliveries/{id}/replay.",
        ordering:
          "Not guaranteed. Events carry `created_at`; order by it rather than by arrival if sequence matters.",
      },
    },
    { id, headers: rateHeaders(caller) }
  );
});
