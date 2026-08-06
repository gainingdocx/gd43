// The `state` parameter, signed.
//
// state is the only thing standing between a customer's account and an attacker
// who gets them to click a crafted callback URL: without it, a victim's session
// can be made to attach the *attacker's* cloud account, and every document the
// victim then approves is filed into a Drive the attacker controls.
//
// So state is not a random string we merely compare — it carries who started
// the flow, is HMAC-signed with server-side key material, and expires. That
// means the callback can verify the flow's origin without a session cookie
// surviving the round trip through Google, which is exactly the thing that
// breaks under strict cross-site cookie rules.

import "server-only";

import { signPayload } from "../crypto";
import type { OAuthProvider } from "./providers";

/** Ten minutes: long enough to read a consent screen, short enough to be useless later. */
const STATE_TTL_MS = 10 * 60 * 1000;

function keyMaterial(): string {
  const value = process.env.INTEGRATION_CREDENTIAL_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("OAuth state signing is not configured");
  return value;
}

export interface OAuthState {
  owner: string;
  provider: OAuthProvider;
  issuedAt: number;
  nonce: string;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export async function createState(owner: string, provider: OAuthProvider): Promise<string> {
  const payload: OAuthState = { owner, provider, issuedAt: Date.now(), nonce: crypto.randomUUID() };
  const body = encode(payload);
  return `${body}.${await signPayload(keyMaterial(), body)}`;
}

/**
 * Verify and decode. Returns null for anything not exactly right — a bad
 * signature, a stale flow, or a provider that does not match the callback the
 * state arrived on.
 */
export async function readState(value: string | null, expectedProvider: OAuthProvider): Promise<OAuthState | null> {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = await signPayload(keyMaterial(), body);
  // Constant-time-ish: compare full length, never short-circuit on first
  // differing character, so the signature cannot be guessed byte by byte.
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;

  let parsed: OAuthState;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
  } catch {
    return null;
  }

  if (typeof parsed.owner !== "string" || !parsed.owner) return null;
  // A state minted for Drive must not be replayable against the Gmail
  // callback, which asks for a far more sensitive scope.
  if (parsed.provider !== expectedProvider) return null;
  if (typeof parsed.issuedAt !== "number" || Date.now() - parsed.issuedAt > STATE_TTL_MS) return null;
  // A clock-skewed or forged future timestamp would otherwise never expire.
  if (parsed.issuedAt > Date.now() + 60_000) return null;

  return parsed;
}
