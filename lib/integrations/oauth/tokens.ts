// Token storage, exchange and refresh.
//
// The single rule this file exists to enforce: nothing outside it ever touches
// a raw token. Callers ask for `accessTokenFor(connectionId)` and get a valid
// one, or an error saying the customer must reconnect. Refresh, expiry skew and
// the "provider revoked us" case are handled once, here, rather than in each
// connector.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptConnectorCredentials, encryptConnectorCredentials } from "../connector-secrets";
import { PROVIDERS, providerCredentials, redirectUri, type OAuthProvider } from "./providers";

/**
 * Refresh this long before the stated expiry.
 *
 * A token that expires during a slow upload fails the upload. Sixty seconds
 * covers clock skew between us and the provider plus a request in flight.
 */
const EXPIRY_SKEW_MS = 60_000;

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

/**
 * A token endpoint's refusal, with the machine-readable code kept separate.
 *
 * The human `error_description` is what we want to show and log, but the retry
 * decision has to be made on the OAuth `error` code — matching the description
 * for "invalid_grant" never fires, because the description says things like
 * "Token has been expired or revoked". Getting this wrong means a revoked
 * connection is retried forever and the customer is never told to reconnect.
 */
class TokenEndpointError extends Error {
  constructor(public readonly code: string | null, message: string) {
    super(message);
    this.name = "TokenEndpointError";
  }
}

async function postForm(url: string, body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(body).toString(),
    // Never follow a redirect while carrying a client secret.
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || payload.error) {
    throw new TokenEndpointError(
      payload.error ?? null,
      payload.error_description ?? payload.error ?? `Token endpoint returned HTTP ${response.status}`
    );
  }
  return payload;
}

function toTokenSet(payload: TokenResponse, fallbackRefresh: string | null, requested: readonly string[]): TokenSet {
  if (!payload.access_token) throw new Error("Token endpoint returned no access token");
  return {
    accessToken: payload.access_token,
    // A refresh response usually omits the refresh token, meaning "keep the one
    // you have". Treating the absence as a revocation would log the customer
    // out on the first successful refresh.
    refreshToken: payload.refresh_token ?? fallbackRefresh,
    expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : null,
    // What the user actually granted, which can be less than we asked for.
    scopes: payload.scope ? payload.scope.split(" ").filter(Boolean) : [...requested],
  };
}

/** Trade an authorization code for tokens. */
export async function exchangeCode(provider: OAuthProvider, code: string): Promise<TokenSet> {
  const credentials = providerCredentials(provider);
  if (!credentials) throw new Error(`${PROVIDERS[provider].label} is not configured on this deployment`);

  const payload = await postForm(PROVIDERS[provider].tokenUrl, {
    grant_type: "authorization_code",
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: redirectUri(provider),
  });
  return toTokenSet(payload, null, PROVIDERS[provider].scopes);
}

async function refresh(provider: OAuthProvider, refreshToken: string): Promise<TokenSet> {
  const credentials = providerCredentials(provider);
  if (!credentials) throw new Error(`${PROVIDERS[provider].label} is not configured on this deployment`);

  const payload = await postForm(PROVIDERS[provider].tokenUrl, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });
  return toTokenSet(payload, refreshToken, PROVIDERS[provider].scopes);
}

export async function saveTokens(
  connectionId: string,
  tokens: TokenSet,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const envelope = await encryptConnectorCredentials({
    access_token: tokens.accessToken,
    ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
  });
  await createAdminClient()
    .from("oauth_connections")
    .update({
      encrypted_tokens: envelope,
      expires_at: tokens.expiresAt?.toISOString() ?? null,
      scopes: tokens.scopes,
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", connectionId);
}

/**
 * Mark a connection as needing the customer's attention.
 *
 * Used when the provider says the grant is gone — a revoked app, a changed
 * password, an expired refresh token. Retrying that forever is pointless; the
 * only fix is a human reconnecting, so the row says so and the UI shows it.
 */
async function markNeedsReauth(connectionId: string, message: string): Promise<void> {
  await createAdminClient()
    .from("oauth_connections")
    .update({ status: "needs_reauth", last_error: message.slice(0, 300), updated_at: new Date().toISOString() })
    .eq("id", connectionId);
}

export class ReauthRequiredError extends Error {
  constructor(public readonly connectionId: string, message: string) {
    super(message);
    this.name = "ReauthRequiredError";
  }
}

/**
 * A valid access token for a connection, refreshing first if needed.
 *
 * Throws `ReauthRequiredError` when only the customer can fix it, so callers
 * can tell "try again later" apart from "stop trying".
 */
export async function accessTokenFor(connectionId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("oauth_connections")
    .select("id, provider, encrypted_tokens, expires_at, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (!connection) throw new Error("Connection not found");
  if (connection.status === "disabled") throw new Error("Connection is disabled");
  if (!connection.encrypted_tokens) {
    await markNeedsReauth(connectionId, "No stored credential. Reconnect the account.");
    throw new ReauthRequiredError(connectionId, "No stored credential");
  }

  const stored = await decryptConnectorCredentials(connection.encrypted_tokens);
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : null;
  const stillValid = expiresAt === null || expiresAt - EXPIRY_SKEW_MS > Date.now();
  if (stillValid && stored.access_token) return stored.access_token;

  if (!stored.refresh_token) {
    await markNeedsReauth(connectionId, "The stored credential expired and no refresh token is held. Reconnect the account.");
    throw new ReauthRequiredError(connectionId, "Access token expired with no refresh token");
  }

  try {
    const refreshed = await refresh(connection.provider as OAuthProvider, stored.refresh_token);
    await saveTokens(connectionId, refreshed);
    return refreshed.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    // Decided on the OAuth error *code*, never the description. These four mean
    // the grant is gone for good and only the customer can restore it.
    // Anything else — a 500, a timeout, a network blip — is transient, so the
    // connection stays active and the next sweep tries again.
    const code = error instanceof TokenEndpointError ? error.code : null;
    const permanent = code !== null && ["invalid_grant", "unauthorized_client", "invalid_client", "invalid_scope"].includes(code);
    if (permanent) {
      await markNeedsReauth(connectionId, message);
      throw new ReauthRequiredError(connectionId, message);
    }
    throw error;
  }
}
