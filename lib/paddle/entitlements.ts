import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PlanId } from "./config";

export type Entitlement = {
  plan: PlanId;
  status: string | null;
  isPro: boolean;
  currentPeriodEnd: string | null;
  scheduledChangeAt: string | null;
  hasBillingAccount: boolean;
};

const FREE: Entitlement = {
  plan: "free",
  status: null,
  isPro: false,
  currentPeriodEnd: null,
  scheduledChangeAt: null,
  hasBillingAccount: false,
};

// past_due keeps access during Paddle's dunning grace; paused/canceled do not.
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

/** The signed-in user's plan, read from our mirrored subscriptions row (RLS
 *  lets an owner read their own). Returns the free baseline when unauthenticated
 *  or unsubscribed. */
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FREE;

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, scheduled_change_at, paddle_customer_id")
    .eq("owner", user.id)
    .maybeSingle();

  if (!data) return FREE;

  const isPro = data.plan === "pro" && ACTIVE_STATUSES.has(data.status ?? "");
  return {
    plan: isPro ? "pro" : "free",
    status: data.status ?? null,
    isPro,
    currentPeriodEnd: data.current_period_end ?? null,
    scheduledChangeAt: data.scheduled_change_at ?? null,
    hasBillingAccount: Boolean(data.paddle_customer_id),
  };
}
