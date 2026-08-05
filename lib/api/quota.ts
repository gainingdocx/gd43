// Monthly document allowance for API callers.
//
// This is the half of metering the rate limiter does not cover. The rate limit
// bounds how *fast* a key may call; this bounds how *much* the account may
// consume in a billing cycle, and it is the same allowance the web app and
// email ingestion draw on — one document is one document however it arrives.
//
// Overage is deliberate policy, not an oversight:
//   - free hard-stops, because an unpaid account must never accrue a bill it
//     did not agree to;
//   - paid plans may run past the allowance and be billed for the excess,
//     because failing a production integration mid-shipment is worse than a
//     small invoice;
//   - and both are capped, because a retry loop is a real failure mode and it
//     should hit a wall it can see rather than bill forever.

import { getUsageContext } from "@/lib/billing/usage";
import {
  PLAN_ALLOWS_OVERAGE,
  PLAN_OVERAGE_RATE_USD,
  overageCeiling,
  type PlanId,
} from "@/lib/plans";
import { ApiError } from "./errors";

export interface QuotaState {
  plan: PlanId;
  limit: number;
  used: number;
  remaining: number;
  /** Documents consumed beyond the allowance this cycle. */
  overage: number;
  overageRateUsd: number;
  /** Accrued cost of this cycle's overage, in USD. */
  overageCostUsd: number;
  ceiling: number;
}

export async function quotaFor(owner: string): Promise<QuotaState> {
  const { plan, limit, used } = await getUsageContext(owner);
  const overage = Math.max(0, used - limit);
  const rate = PLAN_OVERAGE_RATE_USD[plan];
  return {
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    overage,
    overageRateUsd: rate,
    // Rounded to cents so the figure a customer sees matches what is billed.
    overageCostUsd: Math.round(overage * rate * 100) / 100,
    ceiling: limit + overageCeiling(plan),
  };
}

/**
 * Assert the account may consume one more document, throwing the documented
 * error envelope when it may not.
 *
 * 402 rather than 429 is intentional: 429 tells a client to retry later, which
 * is true for a rate limit and false here. Payment or a plan change is the only
 * thing that clears this, and a client that retries a 402 forever is a bug we
 * would have caused.
 */
export async function assertDocumentQuota(owner: string): Promise<QuotaState> {
  const quota = await quotaFor(owner);

  if (quota.used < quota.limit) return quota;

  if (!PLAN_ALLOWS_OVERAGE[quota.plan]) {
    throw new ApiError({
      type: "invalid_request_error",
      code: "quota_exceeded",
      message:
        `Monthly allowance of ${quota.limit} documents reached on the ${quota.plan} plan. ` +
        `Upgrade to continue, or wait for the next billing cycle.`,
      status: 402,
      headers: quotaHeaders(quota),
    });
  }

  if (quota.used >= quota.ceiling) {
    throw new ApiError({
      type: "invalid_request_error",
      code: "overage_ceiling_reached",
      message:
        `Usage has reached the ${quota.ceiling}-document ceiling for this cycle ` +
        `(${quota.limit} included plus overage). This cap exists to stop a runaway ` +
        `integration billing without limit. Contact support to raise it.`,
      status: 402,
      headers: quotaHeaders(quota),
    });
  }

  return quota;
}

/** Usage headers so a client can see it approaching the wall before it hits it. */
export function quotaHeaders(quota: QuotaState): Record<string, string> {
  return {
    "X-Documents-Limit": String(quota.limit),
    "X-Documents-Used": String(quota.used),
    "X-Documents-Remaining": String(quota.remaining),
    ...(quota.overage > 0
      ? {
          "X-Documents-Overage": String(quota.overage),
          "X-Documents-Overage-Cost-USD": quota.overageCostUsd.toFixed(2),
        }
      : {}),
  };
}
