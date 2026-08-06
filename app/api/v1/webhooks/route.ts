// GET  /v1/webhooks — list destinations
// POST /v1/webhooks — create one
//
// Destination management belongs in the API because the customers most likely
// to need many of them — one per environment, one per branch office — are the
// ones least likely to want to click through a UI for each.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight, readJson } from "@/lib/api/respond";
import { badRequest, serverError } from "@/lib/api/errors";
import { requireArray, requireEnum, requireString } from "@/lib/api/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES, isIntegrationEvent } from "@/lib/integrations/events";

const KINDS = ["webhook", "slack", "teams"] as const;
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

function serializeEndpoint(row: EndpointRow) {
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
    // The signing secret is returned exactly once, by POST. There is no
    // endpoint that reveals it later — a leaked key would otherwise be
    // retrievable by anyone who leaked it.
  };
}

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const { data, error } = await createAdminClient()
    .from("webhook_endpoints")
    .select("id, url, kind, description, enabled, events, min_severity, created_at")
    .eq("owner", caller.owner)
    .order("created_at", { ascending: false });
  if (error) throw serverError("Destinations could not be listed.");

  const rows = (data ?? []) as EndpointRow[];
  return json(list(rows.map(serializeEndpoint), { total: rows.length }), { id, headers: rateHeaders(caller) });
});

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  const body = await readJson(request);

  const kind = requireEnum(body.kind, "kind", KINDS, "webhook");
  const rawUrl = requireString(body.url, "url", { max: 2000 });
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest("`url` must be a valid URL.", "url");
  }
  // Refusing private and loopback hosts is not politeness: an endpoint pointed
  // at an internal address turns our worker into a request proxy inside
  // whatever network it can reach.
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    host === "localhost" ||
    host.endsWith(".local") ||
    /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^\[?::1\]?$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw badRequest("`url` must be a public HTTPS address.", "url", "unsupported_endpoint");
  }

  let events = [...EVENT_TYPES] as string[];
  if (body.events !== undefined) {
    const requested = requireArray<string>(body.events, "events", { min: 1, max: EVENT_TYPES.length });
    const unknown = requested.filter((event) => !isIntegrationEvent(event));
    if (unknown.length > 0) {
      throw badRequest(`Unknown event type(s): ${unknown.join(", ")}. See GET /v1/events.`, "events", "unknown_event_type");
    }
    events = requested;
  }

  const secret = `whsec_${Buffer.from(crypto.getRandomValues(new Uint8Array(30))).toString("base64url")}`;
  const { data, error } = await createAdminClient()
    .from("webhook_endpoints")
    .insert({
      owner: caller.owner,
      url: url.toString(),
      kind,
      description: body.description === undefined ? null : requireString(body.description, "description", { max: 120 }),
      events,
      min_severity: requireEnum(body.min_severity, "min_severity", SEVERITIES, kind === "webhook" ? "all" : "critical"),
      signing_secret: secret,
    })
    .select("id, url, kind, description, enabled, events, min_severity, created_at")
    .maybeSingle();
  if (error || !data) throw serverError("The destination could not be created.");

  return json(
    {
      ...serializeEndpoint(data as EndpointRow),
      // Shown once. Chat destinations receive one too, unused today, so that a
      // later signed chat app does not require every customer to re-create.
      signing_secret: secret,
    },
    { id, status: 201, headers: rateHeaders(caller) }
  );
});
