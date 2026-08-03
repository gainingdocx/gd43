import { createAdminClient } from "@/lib/supabase/admin";

const CATEGORIES = new Set(["suggestion", "problem", "praise", "other"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request))) {
    return Response.json(
      { error: "Too many messages were sent. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The feedback form could not be read." }, { status: 400 });
  }

  const category = cleanText(body.category);
  const message = cleanText(body.message);
  const email = cleanText(body.email);
  const page = cleanText(body.page);
  const company = cleanText(body.company);
  const visitorId = cleanText(body.visitorId);
  const sessionId = cleanText(body.sessionId);

  // Honeypot fields are invisible to people. Silently accept bot submissions.
  if (company) return Response.json({ ok: true });

  if (!CATEGORIES.has(category)) {
    return Response.json({ error: "Please choose a feedback type." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 2000) {
    return Response.json(
      { error: "Please write between 10 and 2,000 characters." },
      { status: 400 },
    );
  }
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  let pagePath = "/";
  if (page) {
    try {
      const url = new URL(page);
      pagePath = `${url.pathname}${url.search}`.slice(0, 500);
    } catch {
      if (page.startsWith("/")) pagePath = page.slice(0, 500);
    }
  }

  const countryHeader = request.headers.get("cf-ipcountry")?.toUpperCase();
  const countryCode =
    countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;

  try {
    const admin = createAdminClient();
    const validVisitorId = UUID_PATTERN.test(visitorId) ? visitorId : null;
    const validSessionId = UUID_PATTERN.test(sessionId) ? sessionId : null;
    const { error } = await admin.from("feedback_submissions").insert({
      category,
      message,
      email: email || null,
      page_path: pagePath,
      visitor_id: validVisitorId,
      session_id: validSessionId,
      country_code: countryCode,
    });
    if (error) throw error;

    if (validVisitorId && validSessionId) {
      await admin.from("analytics_events").insert({
        event_type: "feature_use",
        feature: "Feedback submission",
        path: pagePath,
        visitor_id: validVisitorId,
        session_id: validSessionId,
        country_code: countryCode,
        device_type: "unknown",
      });
    }
  } catch (error) {
    console.error("Feedback storage failed.", error);
    return Response.json(
      { error: "We could not save your feedback. Please try again." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
