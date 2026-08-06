// GET    /v1/webhooks/{id} — retrieve one destination
// PATCH  /v1/webhooks/{id} — enable, disable or re-subscribe it
// DELETE /v1/webhooks/{id} — remove it
//
// PATCH exists mainly so a customer can disable a destination during their own
// maintenance window without deleting it and losing the signing secret every
// receiver is already verifying against.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { badRequest, notFound, serverError } from "@/lib/api/errors";
import { pathSegment, requireArray, requireEnum } from "@/lib/api/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES, isIntegrationEvent } from "@/lib/integrations/events";

const SELECT = "id, url, kind, description, enabled, events, min_severity, created_at";
const SEVERITIES = ["all", "critical"] as const;

export const OPTIONS = preflight;

interface EndpointRow {
  id: string;
  url: string;
  kind: string;
  description: string | null;
  enabled: boolean;
  events: string[];
  min_severity: string;
  created_at: string;
}

function serialize(row: EndpointRow) {
  return {
    id: row.id,
    object: "webhook_endpoint" as const,
    url: row.url,
    kind: row.kind,
    description: row.description,
    enabled: row.enabled,
    events: row.events,
    min_severity: row.min_severity,
    created_at: row.created_at,
  };
}

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const webhookId = pathSegment(request);
  const { data } = await createAdminClient()
    .from("webhook_endpoints")
    .select(SELECT)
    .eq("id", webhookId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (!data) throw notFound(`No destination with id '${webhookId}'.`, "webhook_not_found");
  return json(serialize(data as EndpointRow), { id, headers: rateHeaders(caller) });
});

export const PATCH = handler(async (request, id) => {
  const caller = await authenticate(request);
  const webhookId = pathSegment(request);
  const body = await readJson(request);

  const update: Record<string, unknown> = {};
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") throw badRequest("`enabled` must be a boolean.", "enabled");
    update.enabled = body.enabled;
  }
  if (body.min_severity !== undefined) {
    update.min_severity = requireEnum(body.min_severity, "min_severity", SEVERITIES);
  }
  if (body.events !== undefined) {
    const requested = requireArray<string>(body.events, "events", { min: 1, max: EVENT_TYPES.length });
    const unknown = requested.filter((event) => !isIntegrationEvent(event));
    if (unknown.length > 0) {
      throw badRequest(`Unknown event type(s): ${unknown.join(", ")}. See GET /v1/events.`, "events", "unknown_event_type");
    }
    update.events = requested;
  }
  if (Object.keys(update).length === 0) {
    throw badRequest("Provide at least one of `enabled`, `events` or `min_severity`.", "enabled");
  }

  const { data, error } = await createAdminClient()
    .from("webhook_endpoints")
    .update(update)
    .eq("id", webhookId)
    .eq("owner", caller.owner)
    .select(SELECT)
    .maybeSingle();
  if (error) throw serverError("The destination could not be updated.");
  if (!data) throw notFound(`No destination with id '${webhookId}'.`, "webhook_not_found");

  return json(serialize(data as EndpointRow), { id, headers: rateHeaders(caller) });
});

export const DELETE = handler(async (request, id) => {
  const caller = await authenticate(request);
  const webhookId = pathSegment(request);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("webhook_endpoints")
    .select("id")
    .eq("id", webhookId)
    .eq("owner", caller.owner)
    .maybeSingle();
  if (!existing) throw notFound(`No destination with id '${webhookId}'.`, "webhook_not_found");

  const { error } = await admin.from("webhook_endpoints").delete().eq("id", webhookId).eq("owner", caller.owner);
  if (error) throw serverError("The destination could not be deleted.");

  return json({ id: webhookId, object: "webhook_endpoint", deleted: true }, { id, headers: rateHeaders(caller) });
});
