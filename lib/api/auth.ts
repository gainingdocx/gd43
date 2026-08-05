// API key authentication and quota enforcement.
//
// Keys are stored only as SHA-256 hashes, so a database leak does not hand over
// working credentials and the plaintext is shown exactly once at creation. The
// prefix (`gdx_live_`) is checked before hashing purely to reject obvious
// non-keys without a database round trip.

import { createAdminClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/integrations/webhooks";
import { normalizePlan, PLAN_API_RATE_LIMIT, type PlanId } from "@/lib/plans";
import { ApiError, unauthorized } from "./errors";

export interface ApiCaller {
  keyId: string;
  owner: string;
  plan: PlanId;
  /** Requests remaining in the current window, for response headers. */
  remaining: number;
  resetAt: string;
  limit: number;
}

const KEY_PREFIX = "gdx_live_";

/**
 * Documented default, used where a plan is not in hand (the OpenAPI description
 * and the docs page). The limit actually enforced is per plan — see
 * PLAN_API_RATE_LIMIT.
 */
export const RATE_LIMIT = PLAN_API_RATE_LIMIT.pro;
export const RATE_WINDOW_SECONDS = 60;

function bearer(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  // Accepting the raw key without the scheme is a common client mistake and
  // costs nothing to support, but it is not documented.
  return header.trim();
}

/**
 * Authenticate the caller and consume one unit of quota.
 *
 * Throws `ApiError` on any failure so route handlers can call this as the first
 * line and let the wrapper format the response.
 */
export async function authenticate(request: Request): Promise<ApiCaller> {
  const token = bearer(request);
  if (!token) {
    throw unauthorized(
      "Missing API key. Send it as `Authorization: Bearer gdx_live_...`.",
      "missing_api_key"
    );
  }
  if (!token.startsWith(KEY_PREFIX) || token.length < 30) {
    throw unauthorized("That is not a valid GainingDocx API key.");
  }

  const admin = createAdminClient();
  const keyHash = await sha256(token);
  const { data: key } = await admin
    .from("api_keys")
    .select("id, owner, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!key) throw unauthorized("This API key is invalid.");
  if (key.revoked_at) throw unauthorized("This API key has been revoked.", "revoked_api_key");

  // The rate a key may call at is a property of the account's plan, so this
  // costs one indexed lookup per request. Embedding it in the key row instead
  // would go stale the moment a subscription changes.
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", key.owner).maybeSingle();
  const plan = normalizePlan(profile?.plan);
  const rateLimit = PLAN_API_RATE_LIMIT[plan];

  const { data: quota, error } = await admin
    .rpc("api_rate_limit", {
      p_key_id: key.id,
      p_limit: rateLimit,
      p_window_seconds: RATE_WINDOW_SECONDS,
    })
    .maybeSingle<{ allowed: boolean; used: number; remaining: number; reset_at: string }>();

  // A rate-limiter outage must not take the API down with it; failing open is
  // the right trade here because the limiter protects against abuse, not
  // correctness, and the request is already authenticated.
  if (error || !quota) {
    console.error("[api] rate limit unavailable", error);
    return {
      keyId: key.id,
      owner: key.owner,
      plan,
      remaining: rateLimit,
      resetAt: new Date(Date.now() + RATE_WINDOW_SECONDS * 1000).toISOString(),
      limit: rateLimit,
    };
  }

  const resetAt = new Date(quota.reset_at).toISOString();
  if (!quota.allowed) {
    const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
    throw new ApiError({
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
      message:
        `Rate limit of ${rateLimit} requests per ${RATE_WINDOW_SECONDS}s exceeded on the ${plan} plan. ` +
        `Retry after ${retryAfter}s.`,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(rateLimit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetAt,
      },
    });
  }

  // Recorded for the caller's own usage reporting; best-effort by design.
  void admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);

  return { keyId: key.id, owner: key.owner, plan, remaining: quota.remaining, resetAt, limit: rateLimit };
}

/** Rate-limit headers to attach to a successful response. */
export function rateHeaders(caller: ApiCaller): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(caller.limit),
    "X-RateLimit-Remaining": String(caller.remaining),
    "X-RateLimit-Reset": caller.resetAt,
  };
}
