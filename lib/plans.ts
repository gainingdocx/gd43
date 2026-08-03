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
