import { sendCloudflareEmail } from "@/lib/email/cloudflare";
import { evaluateParseHealth, type ParseHealthTotals } from "@/lib/observability/health";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const WINDOW_MS = 60 * 60 * 1000;

type Dashboard = { totals?: Partial<ParseHealthTotals> };
type Incident = { incident_key: string; severity: "warning" | "critical"; notified_at: string | null };

function totalsFrom(value: unknown): ParseHealthTotals {
  const raw = value && typeof value === "object" ? (value as Dashboard).totals ?? {} : {};
  const number = (input: unknown) => Number.isFinite(Number(input)) ? Number(input) : 0;
  const optional = (input: unknown) => input === null || input === undefined ? null : number(input);
  return {
    requests: number(raw.requests), successes: number(raw.successes), failures: number(raw.failures),
    rejected: number(raw.rejected), review_required: number(raw.review_required),
    average_quality: optional(raw.average_quality), average_duration_ms: optional(raw.average_duration_ms),
    p95_duration_ms: optional(raw.p95_duration_ms),
  };
}

async function sendIncidentAlert(breaches: ReturnType<typeof evaluateParseHealth>, totals: ParseHealthTotals) {
  const recipient = process.env.PARSE_ALERT_EMAIL?.trim();
  if (!recipient) return false;
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://gainingdocx.com").replace(/\/$/, "");
  const lines = breaches.map((item) => `${item.title}: ${Math.round(item.value)} (threshold ${item.threshold})`);
  await sendCloudflareEmail({
    from: { email: "alerts@docs.gainingdocx.com", name: "GainingDocx Operations" },
    to: recipient,
    subject: `[${breaches.some((item) => item.severity === "critical") ? "Critical" : "Warning"}] Document parsing health`,
    html: `<h2>Document parsing needs attention</h2><p>The last 60 minutes crossed an operating threshold.</p><ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul><p>Requests: ${totals.requests}; successes: ${totals.successes}; failures: ${totals.failures}; review required: ${totals.review_required}.</p><p><a href="${base}/app/admin?view=operations&period=7">Open operations health</a></p><p>No document content is included in this alert.</p>`,
    text: `Document parsing needs attention. ${lines.join("; ")}. Open ${base}/app/admin?view=operations&period=7`,
  });
  return true;
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data, error } = await admin.rpc("parse_health_dashboard", { p_since: since });
  if (error) {
    logError("parse_health_query_failed", error);
    return Response.json({ error: "health query failed" }, { status: 500 });
  }

  const totals = totalsFrom(data);
  const breaches = evaluateParseHealth(totals);
  const activeKeys = breaches.map((item) => item.key);
  const { data: existingRows } = await admin.from("service_incidents")
    .select("incident_key, severity, notified_at").eq("service", "document_parsing").eq("status", "open");
  const existing = (existingRows ?? []) as Incident[];
  const existingByKey = new Map(existing.map((item) => [item.incident_key, item]));
  const now = new Date().toISOString();

  for (const breach of breaches) {
    const prior = existingByKey.get(breach.key);
    await admin.from("service_incidents").upsert({
      service: "document_parsing", incident_key: breach.key, severity: breach.severity, status: "open",
      title: breach.title, details: { value: breach.value, threshold: breach.threshold, window_minutes: 60 },
      first_seen_at: prior ? undefined : now, last_seen_at: now, resolved_at: null,
    }, { onConflict: "service,incident_key" });
  }

  const resolved = existing.filter((item) => !activeKeys.includes(item.incident_key)).map((item) => item.incident_key);
  if (resolved.length) {
    await admin.from("service_incidents").update({ status: "resolved", resolved_at: now, last_seen_at: now })
      .eq("service", "document_parsing").in("incident_key", resolved);
  }

  const notify = breaches.filter((item) => {
    const prior = existingByKey.get(item.key);
    return !prior || !prior.notified_at || (prior.severity === "warning" && item.severity === "critical");
  });
  let notified = false;
  if (notify.length) {
    try {
      notified = await sendIncidentAlert(notify, totals);
      if (notified) {
        await admin.from("service_incidents").update({ notified_at: now })
          .eq("service", "document_parsing").in("incident_key", notify.map((item) => item.key));
      }
    } catch (alertError) {
      logError("parse_health_alert_failed", alertError, { incidentKeys: notify.map((item) => item.key) });
    }
  }

  const logFields = { requests: totals.requests, breachCount: breaches.length, resolvedCount: resolved.length, notified };
  if (breaches.length) logWarn("parse_health_breached", logFields);
  else logInfo("parse_health_healthy", logFields);
  return Response.json({ windowMinutes: 60, totals, breaches, resolved, notified });
}
