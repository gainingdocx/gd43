// GET /v1/webhooks/{id}/deliveries — the delivery history for one destination.
//
// This is the endpoint that answers "did you send it, and what did we say" —
// the question every webhook integration eventually argues about. Each row
// carries the attempt count, the status code we saw and the error, so the
// argument is settled by data rather than by both sides guessing.
//
// Error text is stored truncated and is never the raw exception, so a
// receiver's internal detail does not accumulate in our logs.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { notFound, serverError } from "@/lib/api/errors";
import { pagination, pathSegment, requireEnum } from "@/lib/api/validate";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["pending", "delivered", "failed", "dead"] as const;

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const url = new URL(request.url);
  // .../webhooks/{id}/deliveries
  const webhookId = pathSegment(request, 1);
  const { limit, offset } = pagination(url);
  const admin = createAdminClient();

  const { data: endpoint } = await admin
    .from("webhook_endpoints")
    .select("id")
    .eq("id", webhookId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (!endpoint) throw notFound(`No destination with id '${webhookId}'.`, "webhook_not_found");

  let query = admin
    .from("webhook_deliveries")
    .select("id, event_type, event_id, status, response_status, error, attempt, max_attempts, next_attempt_at, delivered_at, duration_ms, idempotency_key, replay_of, attempted_at", { count: "exact" })
    .eq("endpoint_id", webhookId)
    .eq("owner", caller.owner)
    .order("attempted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", requireEnum(status, "status", STATUSES));
  const eventType = url.searchParams.get("event_type");
  if (eventType) query = query.eq("event_type", eventType);

  const { data, error, count } = await query;
  if (error) throw serverError("Deliveries could not be listed.");

  const rows = data ?? [];
  return json(
    list(
      rows.map((row) => ({
        id: row.id,
        object: "webhook_delivery" as const,
        webhook_id: webhookId,
        event_id: row.event_id,
        event_type: row.event_type,
        status: row.status,
        response_status: row.response_status,
        error: row.error,
        attempt: row.attempt,
        max_attempts: row.max_attempts,
        next_attempt_at: row.next_attempt_at,
        delivered_at: row.delivered_at,
        duration_ms: row.duration_ms,
        idempotency_key: row.idempotency_key,
        replay_of: row.replay_of,
        attempted_at: row.attempted_at,
      })),
      { hasMore: count !== null && offset + rows.length < count, total: count ?? undefined }
    ),
    { id, headers: rateHeaders(caller) }
  );
});
