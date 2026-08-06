// The delivery engine: durable, retried, replayable event delivery.
//
// An integration is only worth connecting if the customer can answer three
// questions: did it arrive, why not, and can I send it again. Everything here
// exists to keep those answers true.
//
//   enqueue → attempt → 2xx? delivered
//                     → no?  reschedule with backoff
//                     → attempts exhausted? dead-letter, and tell the customer
//
// The delivery row is the queue. That is a deliberate choice over Cloudflare
// Queues for this path: the customer-visible artefact — "here is every attempt,
// its status code and its body" — has to be in Postgres regardless, and a
// second system holding the authoritative state would let the log and reality
// disagree. The email-ingestion path uses a real queue because there the work
// is heavy; here the work is one HTTP request.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { signPayload } from "./crypto";
import { slackPayload, teamsPayload } from "./chat";
import { isCriticalEvent, isIntegrationEvent, type IntegrationEventType } from "./events";

export type DestinationKind = "webhook" | "slack" | "teams";

/**
 * Backoff between attempts, in seconds: ~1m, 5m, 15m, 1h, 6h.
 *
 * The first retry is fast because most failures are a redeploy or a momentary
 * timeout. The tail is long because the ones that survive an hour are usually a
 * rotated credential or an expired certificate, and hammering those adds load
 * to a system that is already having a bad day. Total window is a little over
 * seven hours — one working day's cover for an endpoint that broke overnight.
 */
const BACKOFF_SECONDS = [60, 300, 900, 3_600, 21_600];
export const MAX_ATTEMPTS = BACKOFF_SECONDS.length + 1;

const DELIVERY_TIMEOUT_MS = 10_000;

interface EndpointRow {
  id: string;
  owner: string;
  url: string;
  kind: DestinationKind;
  signing_secret: string;
  min_severity?: string | null;
}

interface DeliveryRow {
  id: string;
  owner: string;
  endpoint_id: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown> | null;
  attempt: number;
  max_attempts: number;
  idempotency_key: string | null;
}

function backoffFor(attempt: number): number {
  return BACKOFF_SECONDS[Math.min(attempt - 1, BACKOFF_SECONDS.length - 1)];
}

/**
 * Format the outgoing body for a destination.
 *
 * Chat destinations get a rendered message; webhooks get the canonical event
 * envelope. Both are derived from the same stored payload, so a replay to a
 * Slack channel produces the same message it did the first time.
 */
function bodyFor(kind: DestinationKind, envelope: { id: string; type: IntegrationEventType; created_at: string; data: Record<string, unknown> }): string {
  if (kind === "slack") return JSON.stringify(slackPayload(envelope));
  if (kind === "teams") return JSON.stringify(teamsPayload(envelope));
  return JSON.stringify(envelope);
}

async function headersFor(kind: DestinationKind, endpoint: EndpointRow, body: string, delivery: { eventId: string; eventType: string; idempotencyKey: string; attempt: number }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "GainingDocx-Webhooks/2.0",
  };
  // Slack and Teams reject unknown headers on some proxies and cannot verify a
  // signature anyway — the incoming-webhook URL is itself the secret.
  if (kind !== "webhook") return headers;

  headers["X-GainingDocx-Event"] = delivery.eventType;
  headers["X-GainingDocx-Delivery"] = delivery.eventId;
  headers["X-GainingDocx-Attempt"] = String(delivery.attempt);
  // Stable across every attempt of one event, so a receiver that already
  // committed attempt 2 can discard attempt 3 after its own timeout.
  headers["Idempotency-Key"] = delivery.idempotencyKey;
  headers["X-GainingDocx-Signature"] = `sha256=${await signPayload(endpoint.signing_secret, body)}`;
  return headers;
}

/**
 * Send one delivery and record the outcome.
 *
 * Never throws: a delivery failure is data, not an exception, and the caller is
 * usually a request the customer is waiting on.
 */
export async function attemptDelivery(
  delivery: DeliveryRow,
  endpoint: EndpointRow
): Promise<{ delivered: boolean; status: number | null; error: string | null; state: "delivered" | "pending" | "dead" }> {
  const admin = createAdminClient();
  const envelope = (delivery.payload ?? {
    id: delivery.event_id,
    type: delivery.event_type,
    created_at: new Date().toISOString(),
    data: {},
  }) as { id: string; type: IntegrationEventType; created_at: string; data: Record<string, unknown> };

  const body = bodyFor(endpoint.kind, envelope);
  const startedAt = Date.now();
  let status: number | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: await headersFor(endpoint.kind, endpoint, body, {
        eventId: delivery.event_id,
        eventType: delivery.event_type,
        idempotencyKey: delivery.idempotency_key ?? delivery.event_id,
        attempt: delivery.attempt,
      }),
      body,
      // Redirects are never followed: a redirect to an attacker-chosen host
      // would replay the signed body somewhere the customer never authorised.
      //
      // `redirect: "error"` is the obvious way to say that and it is the one
      // thing Workers refuses — it rejects the option outright rather than at
      // redirect time, so every delivery failed before a request was even made.
      // Node's fetch accepts it, which is why this only showed up in
      // production. Ask for the 3xx back instead and refuse it below.
      redirect: "manual",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    status = response.status;
    if (status >= 300 && status < 400) {
      error =
        `Endpoint redirected (HTTP ${status}). Point the destination at its final URL — ` +
        "redirects are never followed, because that would send your signed payload to a host you did not configure.";
    } else if (!response.ok) {
      error = `Endpoint returned HTTP ${response.status}`;
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message.slice(0, 300) : "Delivery failed";
  }

  const durationMs = Date.now() - startedAt;
  const delivered = !error;
  // 4xx other than 408/429 is the receiver saying "this request is wrong", and
  // repeating it unchanged for seven hours will not make it right. Those go
  // straight to dead-letter where the customer can see and fix them. A 3xx is
  // in the same category: we will not follow it now or in six hours, so the
  // customer has to change the URL.
  const permanent = status !== null && status >= 300 && status < 500 && status !== 408 && status !== 429;
  const exhausted = delivery.attempt >= delivery.max_attempts;
  const finalState = delivered ? "delivered" : permanent || exhausted ? "dead" : "pending";

  await admin
    .from("webhook_deliveries")
    .update({
      status: finalState,
      response_status: status,
      error,
      duration_ms: durationMs,
      attempted_at: new Date().toISOString(),
      delivered_at: delivered ? new Date().toISOString() : null,
      next_attempt_at: finalState === "pending"
        ? new Date(Date.now() + backoffFor(delivery.attempt) * 1000).toISOString()
        : null,
    })
    .eq("id", delivery.id);

  if (finalState === "dead") await announceDeadLetter(delivery, endpoint, status, error);

  // `state` is returned rather than left for the caller to re-derive: a
  // permanent 4xx dies on attempt 1, so inferring death from
  // `attempt >= max_attempts` under-reports exactly the failures an operator
  // most wants to see in the sweep's log line.
  return { delivered, status, error, state: finalState };
}

/**
 * Tell the customer that a delivery gave up.
 *
 * Sent to every destination except the one that failed — notifying a broken
 * endpoint about its own breakage would either fail again or, worse, succeed
 * and loop. The `integration.delivery_failed` event is itself never announced,
 * which is the base case that terminates the recursion.
 */
async function announceDeadLetter(delivery: DeliveryRow, endpoint: EndpointRow, status: number | null, error: string | null) {
  if (delivery.event_type === "integration.delivery_failed") return;
  await enqueueEvent(
    delivery.owner,
    "integration.delivery_failed",
    {
      delivery_id: delivery.id,
      endpoint_id: endpoint.id,
      failed_event_type: delivery.event_type,
      attempts: delivery.attempt,
      last_error: error ?? (status ? `HTTP ${status}` : "network error"),
    },
    { excludeEndpointId: endpoint.id }
  );
}

const ENDPOINT_SELECT = "id, owner, url, kind, signing_secret, events, enabled, min_severity";

/**
 * Queue an event for every destination subscribed to it, then attempt each
 * delivery immediately.
 *
 * Returns the number of deliveries queued. Callers should not await the send
 * portion on a user-facing path — see `emitWebhook`, which is the fire-and-
 * forget wrapper the app uses.
 */
export async function enqueueEvent(
  owner: string,
  type: IntegrationEventType,
  data: Record<string, unknown>,
  options: { excludeEndpointId?: string; eventId?: string } = {}
): Promise<number> {
  if (!isIntegrationEvent(type)) return 0;

  const admin = createAdminClient();
  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select(ENDPOINT_SELECT)
    .eq("owner", owner)
    .eq("enabled", true)
    .contains("events", [type]);

  const critical = isCriticalEvent(type, data);
  const targets = (endpoints ?? []).filter((endpoint) => {
    if (endpoint.id === options.excludeEndpointId) return false;
    return endpoint.min_severity !== "critical" || critical;
  }) as EndpointRow[];
  if (targets.length === 0) return 0;

  const eventId = options.eventId ?? crypto.randomUUID();
  const envelope = { id: eventId, type, created_at: new Date().toISOString(), data };

  // Insert first, send second. If the worker dies between the two, the retry
  // sweep picks the row up; the reverse order would send an event that no
  // delivery log ever knew about.
  const { data: queued } = await admin
    .from("webhook_deliveries")
    .insert(targets.map((endpoint) => ({
      owner,
      endpoint_id: endpoint.id,
      event_type: type,
      event_id: eventId,
      payload: envelope,
      status: "pending",
      attempt: 1,
      max_attempts: MAX_ATTEMPTS,
      idempotency_key: `${eventId}:${endpoint.id}`,
      next_attempt_at: new Date().toISOString(),
    })))
    .select("id, owner, endpoint_id, event_type, event_id, payload, attempt, max_attempts, idempotency_key");

  const rows = (queued ?? []) as DeliveryRow[];
  const byEndpoint = new Map(targets.map((endpoint) => [endpoint.id, endpoint]));
  await Promise.all(rows.map(async (row) => {
    const endpoint = byEndpoint.get(row.endpoint_id);
    if (endpoint) await attemptDelivery(row, endpoint);
  }));

  return rows.length;
}

/**
 * Retry every delivery whose backoff has elapsed. Called by the cron trigger.
 *
 * Claims rows by incrementing `attempt` before sending so two overlapping cron
 * invocations cannot double-deliver the same row.
 */
export async function runDueDeliveries(limit = 50): Promise<{ processed: number; delivered: number; dead: number }> {
  const admin = createAdminClient();
  const { data: due } = await admin
    .from("webhook_deliveries")
    .select("id, owner, endpoint_id, event_type, event_id, payload, attempt, max_attempts, idempotency_key")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  const rows = (due ?? []) as DeliveryRow[];
  if (rows.length === 0) return { processed: 0, delivered: 0, dead: 0 };

  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select(ENDPOINT_SELECT)
    .in("id", [...new Set(rows.map((row) => row.endpoint_id))]);
  const byEndpoint = new Map(((endpoints ?? []) as EndpointRow[]).map((endpoint) => [endpoint.id, endpoint]));

  let delivered = 0;
  let dead = 0;
  for (const row of rows) {
    const endpoint = byEndpoint.get(row.endpoint_id);
    if (!endpoint) {
      // The destination was deleted while the delivery was in flight. Nothing
      // to send it to, and no reason to keep sweeping the row forever.
      await admin.from("webhook_deliveries")
        .update({ status: "dead", error: "Destination was removed before the delivery succeeded.", next_attempt_at: null })
        .eq("id", row.id);
      dead += 1;
      continue;
    }
    const attempt = row.attempt + 1;
    // Claim the row. A concurrent sweep that already bumped the attempt will
    // not match this filter, so only one worker sends it.
    const { data: claimed } = await admin
      .from("webhook_deliveries")
      .update({ attempt })
      .eq("id", row.id)
      .eq("attempt", row.attempt)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const result = await attemptDelivery({ ...row, attempt }, endpoint);
    if (result.state === "delivered") delivered += 1;
    else if (result.state === "dead") dead += 1;
  }

  return { processed: rows.length, delivered, dead };
}

/**
 * Queue a fresh delivery carrying an earlier delivery's exact payload.
 *
 * Deliberately a new row rather than a reset of the old one: the failed
 * attempts stay on the record. A customer debugging an outage needs to see that
 * it failed five times at 03:00 even after a replay succeeds at 09:00.
 */
export async function replayDelivery(owner: string, deliveryId: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const { data: original } = await admin
    .from("webhook_deliveries")
    .select("id, owner, endpoint_id, event_type, event_id, payload")
    .eq("id", deliveryId)
    .eq("owner", owner)
    .maybeSingle();
  if (!original) return null;

  const { data: endpoint } = await admin
    .from("webhook_endpoints")
    .select(ENDPOINT_SELECT)
    .eq("id", original.endpoint_id)
    .eq("owner", owner)
    .maybeSingle();
  if (!endpoint) return null;

  const replayEventId = crypto.randomUUID();
  const { data: inserted } = await admin
    .from("webhook_deliveries")
    .insert({
      owner,
      endpoint_id: original.endpoint_id,
      event_type: original.event_type,
      event_id: replayEventId,
      // The original body, not a fresh snapshot: a replay that quietly carried
      // newer data would be impossible for a receiver to reconcile with the
      // event it originally missed.
      payload: original.payload,
      status: "pending",
      attempt: 1,
      max_attempts: MAX_ATTEMPTS,
      idempotency_key: `${replayEventId}:${original.endpoint_id}`,
      next_attempt_at: new Date().toISOString(),
      replay_of: original.id,
    })
    .select("id, owner, endpoint_id, event_type, event_id, payload, attempt, max_attempts, idempotency_key")
    .maybeSingle();
  if (!inserted) return null;

  await attemptDelivery(inserted as DeliveryRow, endpoint as EndpointRow);
  return { id: (inserted as DeliveryRow).id };
}

/** Send a sample event to one destination so a customer can prove the wiring. */
export async function sendTestDelivery(owner: string, endpointId: string): Promise<{ delivered: boolean; status: number | null; error: string | null } | null> {
  const admin = createAdminClient();
  const { data: endpoint } = await admin
    .from("webhook_endpoints")
    .select(ENDPOINT_SELECT)
    .eq("id", endpointId)
    .eq("owner", owner)
    .maybeSingle();
  if (!endpoint) return null;

  const eventId = crypto.randomUUID();
  const envelope = {
    id: eventId,
    type: "discrepancy.created" as IntegrationEventType,
    created_at: new Date().toISOString(),
    data: {
      test: true,
      discrepancy_id: "00000000-0000-0000-0000-000000000000",
      shipment_id: "00000000-0000-0000-0000-000000000000",
      severity: "red",
      field: "gross_weight_kg",
      value_a: "12,480 KG",
      value_b: "12,840 KG",
      message: "Sample event from GainingDocx. No shipment was affected.",
    },
  };

  const { data: inserted } = await admin
    .from("webhook_deliveries")
    .insert({
      owner,
      endpoint_id: endpointId,
      event_type: envelope.type,
      event_id: eventId,
      payload: envelope,
      status: "pending",
      attempt: 1,
      // A test that quietly retried for seven hours would tell the customer
      // nothing at the moment they pressed the button.
      max_attempts: 1,
      idempotency_key: `${eventId}:${endpointId}`,
      next_attempt_at: new Date().toISOString(),
    })
    .select("id, owner, endpoint_id, event_type, event_id, payload, attempt, max_attempts, idempotency_key")
    .maybeSingle();
  if (!inserted) return null;

  return attemptDelivery(inserted as DeliveryRow, endpoint as EndpointRow);
}
