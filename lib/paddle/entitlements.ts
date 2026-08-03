import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUsageContext } from "@/lib/billing/usage";
import type { PlanId } from "./config";

export type Entitlement = {
  plan: PlanId;
  status: string | null;
  isPaid: boolean;
  isPro: boolean;
  isTeam: boolean;
  currentPeriodEnd: string | null;
  scheduledChangeAt: string | null;
  hasBillingAccount: boolean;
  isWorkspaceOwner: boolean;
};

const FREE: Entitlement = {
  plan: "free", status: null, isPaid: false, isPro: false, isTeam: false,
  currentPeriodEnd: null, scheduledChangeAt: null, hasBillingAccount: false,
  isWorkspaceOwner: false,
};
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return FREE;

  const { data } = await supabase.from("subscriptions")
    .select("plan, status, current_period_end, scheduled_change_at, paddle_customer_id")
    .eq("owner", user.id).maybeSingle();
  const usage = await getUsageContext(user.id);
  if (usage.plan === "team" && data?.plan !== "team") {
    return { ...FREE, plan: "team", status: "workspace_member", isPaid: true, isPro: true, isTeam: true };
  }
  if (!data) return FREE;

  const active = ACTIVE_STATUSES.has(data.status ?? "");
  const plan: PlanId = active && (data.plan === "pro" || data.plan === "team") ? data.plan : "free";
  return {
    plan,
    status: data.status ?? null,
    isPaid: plan !== "free",
    isPro: plan === "pro" || plan === "team",
    isTeam: plan === "team",
    currentPeriodEnd: data.current_period_end ?? null,
    scheduledChangeAt: data.scheduled_change_at ?? null,
    hasBillingAccount: Boolean(data.paddle_customer_id),
    isWorkspaceOwner: plan === "team",
  };
}
