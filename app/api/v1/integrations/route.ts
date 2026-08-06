// GET /v1/integrations — the integration catalogue, machine-readable.
//
// The same declarations that drive the public /integrations page. Exposed here
// so a customer can diff it between releases and see exactly when a connector
// moves from `planned` to `live` — rather than discovering it from a changelog
// post, or not at all.
//
// Unauthenticated callers get the catalogue too: it is public information, and
// requiring a key to answer "do you support Xero" is a pointless obstacle.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { INTEGRATION_CATALOG, STATUS_BLURBS, catalogCounts } from "@/lib/integrations/catalog";

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");

  // Authentication is optional here. A key, when present, still consumes quota
  // and gets rate-limit headers back so the caller's own accounting is right.
  let headers: Record<string, string> = {};
  try {
    headers = rateHeaders(await authenticate(request));
  } catch {
    headers = {};
  }

  const entries = INTEGRATION_CATALOG.filter(
    (entry) => (!status || entry.status === status) && (!category || entry.category === category)
  );

  return json(
    {
      ...list(
        entries.map((entry) => ({
          object: "integration" as const,
          id: entry.id,
          provider: entry.provider,
          category: entry.category,
          status: entry.status,
          status_meaning: STATUS_BLURBS[entry.status],
          access: entry.access,
          summary: entry.summary,
          triggers: entry.triggers,
          actions: entry.actions,
          data_transmitted: entry.dataTransmitted,
          required_plan: entry.requiredPlan,
          setup: entry.setup,
          scopes: entry.scopes ?? null,
          rate_limit: entry.rateLimit ?? null,
          retry_policy: entry.retryPolicy,
          idempotency: entry.idempotency,
          attachment_limit: entry.attachmentLimit ?? null,
          partner_note: entry.partnerNote ?? null,
          docs_url: entry.docsPath ? `https://gainingdocx.com${entry.docsPath}` : null,
        })),
        { total: entries.length }
      ),
      counts: catalogCounts(),
      status_meanings: STATUS_BLURBS,
    },
    { id, headers }
  );
});
