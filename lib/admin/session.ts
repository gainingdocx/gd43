import "server-only";

import { cookies } from "next/headers";

const COOKIE_NAME = "gainingdocx_admin_session";
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(value: string): Promise<string | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64Url(new Uint8Array(signature));
}

async function equalSecret(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
}

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = (process.env.ADMIN_PORTAL_USERNAME || "suhasgovind").trim();
  const expectedPassword = process.env.ADMIN_PORTAL_PASSWORD || "";
  if (!expectedPassword || expectedPassword.length < 14) return false;
  const [usernameMatches, passwordMatches] = await Promise.all([
    equalSecret(username.trim().toLowerCase(), expectedUsername.toLowerCase()),
    equalSecret(password, expectedPassword),
  ]);
  return usernameMatches && passwordMatches;
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = base64Url(JSON.stringify({ expiresAt }));
  const signature = await hmac(payload);
  if (!signature) throw new Error("Administrator session security is not configured.");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature) return false;

  const expectedSignature = await hmac(payload);
  if (!expectedSignature || !(await equalSecret(suppliedSignature, expectedSignature))) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
    };
    return typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
