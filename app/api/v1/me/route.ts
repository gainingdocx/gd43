// GET /v1/me — verify a key and report what it can do.
//
// The first call any integrator makes. It answers "is my key working, what
// plan am I on, and how much quota do I have left" in one round trip, which is
// why every established API ships an equivalent.

import { authenticate, rateHeaders, RATE_WINDOW_SECONDS } from "@/lib/api/auth";
import { handler, json, preflight } from "@/lib/api/respond";
import { quotaFor, quotaHeaders } from "@/lib/api/quota";
import { PLAN_ALLOWS_OVERAGE } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const admin = createAdminClient();

  const [{ data: key }, { count: documentCount }, quota] = await Promise.all([
    admin.from("api_keys").select("id, name, key_prefix, created_at, last_used_at").eq("id", caller.keyId).maybeSingle(),
    admin.from("documents").select("id", { count: "exact", head: true }).eq("owner", caller.owner),
    quotaFor(caller.owner),
  ]);

  return json(
    {
      object: "account",
      // The owner id is stable and safe to expose to its own owner; it is what
      // support will ask for.
      account_id: caller.owner,
      plan: caller.plan,
      api_key: {
        id: caller.keyId,
        name: key?.name ?? null,
        prefix: key?.key_prefix ?? null,
        created_at: key?.created_at ?? null,
        last_used_at: key?.last_used_at ?? null,
      },
      usage: {
        documents_all_time: documentCount ?? 0,
        // Current billing cycle. This is the figure that decides whether the
        // next parse succeeds, so it is the one worth polling.
        documents_this_cycle: quota.used,
        included: quota.limit,
        remaining: quota.remaining,
      },
      overage: {
        allowed: PLAN_ALLOWS_OVERAGE[caller.plan],
        documents: quota.overage,
        rate_usd_per_document: quota.overageRateUsd,
        accrued_usd: quota.overageCostUsd,
        // Hard stop, so a runaway integration cannot bill without limit.
        ceiling_documents: quota.ceiling,
      },
      rate_limit: {
        limit: caller.limit,
        window_seconds: RATE_WINDOW_SECONDS,
        remaining: caller.remaining,
        reset_at: caller.resetAt,
      },
    },
    { id, headers: { ...rateHeaders(caller), ...quotaHeaders(quota) } }
  );
});
