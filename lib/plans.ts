export const GUEST_DAILY_DOCUMENT_LIMIT = 1;
export const FREE_MONTHLY_DOCUMENT_LIMIT = 20;
export const PRO_MONTHLY_DOCUMENT_LIMIT = 500;
export const TEAM_MONTHLY_DOCUMENT_LIMIT = 2000;
export const TEAM_SEAT_LIMIT = 5;

export type PlanId = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: FREE_MONTHLY_DOCUMENT_LIMIT,
  pro: PRO_MONTHLY_DOCUMENT_LIMIT,
  team: TEAM_MONTHLY_DOCUMENT_LIMIT,
};

export const PLAN_NAMES: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

export function isPaidPlan(plan: string | null | undefined): plan is "pro" | "team" {
  return plan === "pro" || plan === "team";
}

// ---------------------------------------------------------------------------
// API entitlements
// ---------------------------------------------------------------------------
// Documents parsed through the API draw on the same monthly allowance as the
// web app — one document is one document however it arrives, which is the only
// model a customer can reason about. What differs by plan is the request rate
// and whether the account may run past its allowance at all.

/** Requests per minute, per key. Bursty batch jobs are why paid tiers are higher. */
export const PLAN_API_RATE_LIMIT: Record<PlanId, number> = {
  free: 30,
  pro: 120,
  team: 300,
};

/**
 * Whether the plan may exceed its document allowance and be billed for the
 * excess. Free hard-stops: an unpaid account must never accrue a bill it did
 * not agree to, and silently continuing would be worse than a clear 402.
 */
export const PLAN_ALLOWS_OVERAGE: Record<PlanId, boolean> = {
  free: false,
  pro: true,
  team: true,
};

/**
 * USD per document beyond the monthly allowance. Set below the per-document
 * cost of every published competitor so overage is never a punishment for
 * growth — it is priced to be the cheapest way to absorb a volume spike.
 */
export const PLAN_OVERAGE_RATE_USD: Record<PlanId, number> = {
  free: 0,
  pro: 0.04,
  team: 0.03,
};

/**
 * Hard ceiling on billable overage per cycle, as a multiple of the allowance.
 * A runaway integration is a real failure mode — a loop that retries forever
 * should hit a wall it can see rather than generate an unbounded invoice.
 */
export const OVERAGE_CEILING_MULTIPLE = 2;

export function overageCeiling(plan: PlanId): number {
  return PLAN_ALLOWS_OVERAGE[plan] ? PLAN_LIMITS[plan] * OVERAGE_CEILING_MULTIPLE : 0;
}

export function normalizePlan(value: string | null | undefined): PlanId {
  return value === "pro" || value === "team" ? value : "free";
}
