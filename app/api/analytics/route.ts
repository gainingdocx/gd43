import { createAdminClient } from "@/lib/supabase/admin";

const EVENT_TYPES = new Set(["page_view", "feature_use"]);
const DEVICE_TYPES = new Set(["desktop", "mobile", "tablet", "unknown"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const attempts = new Map<string, { count: number; resetAt: number }>();

function text(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site"].includes(fetchSite)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (rateLimited(clientKey(request))) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const eventType = text(body.eventType, 30);
  const feature = text(body.feature, 100);
  const path = text(body.path, 500);
  const visitorId = text(body.visitorId, 36);
  const sessionId = text(body.sessionId, 36);
  const requestedDevice = text(body.deviceType, 20) || "unknown";
  if (
    !eventType ||
    !EVENT_TYPES.has(eventType) ||
    !feature ||
    !path?.startsWith("/") ||
    !visitorId ||
    !UUID_PATTERN.test(visitorId) ||
    !sessionId ||
    !UUID_PATTERN.test(sessionId)
  ) {
    return Response.json({ error: "invalid analytics event" }, { status: 400 });
  }

  const countryHeader = request.headers.get("cf-ipcountry")?.toUpperCase();
  const countryCode =
    countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
  const device = DEVICE_TYPES.has(requestedDevice) ? requestedDevice : "unknown";

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("analytics_events").insert({
      event_type: eventType,
      feature,
      path,
      visitor_id: visitorId,
      session_id: sessionId,
      country_code: countryCode,
      referrer_host: text(body.referrerHost, 255),
      utm_source: text(body.utmSource, 100),
      utm_medium: text(body.utmMedium, 100),
      utm_campaign: text(body.utmCampaign, 150),
      device_type: device,
      language: text(body.language, 35),
    });
    if (error) throw error;
  } catch (error) {
    console.error("First-party analytics insert failed.", error);
    return Response.json({ error: "analytics unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true }, { status: 202 });
}
