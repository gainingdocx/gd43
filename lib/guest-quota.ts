import { GUEST_DAILY_DOCUMENT_LIMIT } from "@/lib/plans";

const COOKIE_NAME = "gdx_guest_daily";

interface GuestQuotaResult {
  allowed: boolean;
  remaining: number;
  setCookie?: string;
}

function utcDay(now: Date) {
  return now.toISOString().slice(0, 10);
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signature(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

function sameValue(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/** Signed, HTTP-only guest allowance without storing an anonymous identity. */
export async function consumeGuestDocument(cookieHeader: string | null, now = new Date()): Promise<GuestQuotaResult> {
  const secret = process.env.GUEST_USAGE_SECRET || process.env.OPENROUTER_API_KEY;
  if (!secret) return { allowed: false, remaining: 0 };

  const day = utcDay(now);
  const raw = readCookie(cookieHeader, COOKIE_NAME);
  let count = 0;

  if (raw) {
    const [storedDay, storedCount, storedSignature] = raw.split(".");
    const payload = `${storedDay}.${storedCount}`;
    const expected = await signature(payload, secret);
    const parsedCount = Number.parseInt(storedCount, 10);
    if (storedDay === day && Number.isInteger(parsedCount) && parsedCount >= 0 && storedSignature && sameValue(storedSignature, expected)) {
      count = parsedCount;
    }
  }

  if (count >= GUEST_DAILY_DOCUMENT_LIMIT) return { allowed: false, remaining: 0 };

  const nextCount = count + 1;
  const payload = `${day}.${nextCount}`;
  const value = `${payload}.${await signature(payload, secret)}`;
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return {
    allowed: true,
    remaining: GUEST_DAILY_DOCUMENT_LIMIT - nextCount,
    setCookie: `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Expires=${tomorrow.toUTCString()}; HttpOnly; SameSite=Lax${secure}`,
  };
}
