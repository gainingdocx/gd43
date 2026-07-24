import "server-only";

import {
  EventName,
  type EventEntity,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
} from "@paddle/paddle-node-sdk";

import { createAdminClient } from "@/lib/supabase/admin";
import { planForPriceId } from "./config";

// Statuses that keep access. past_due keeps it during Paddle's dunning grace;
// paused/canceled drop to free. Kept in sync with lib/paddle/entitlements.ts.
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type SubscriptionEvent =
  | SubscriptionCreatedEvent
  | SubscriptionUpdatedEvent
  | SubscriptionCanceledEvent;

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Process one verified Paddle event. Idempotent: the first thing we do is claim
 * the event_id in the ledger; a duplicate delivery hits the primary-key
 * conflict and returns early. The subscription upsert is itself keyed on the
 * owner, so even without the ledger repeated deliveries converge — the ledger
 * is the belt-and-suspenders the build spec called for.
 */
export async function processPaddleEvent(event: EventEntity): Promise<void> {
  const admin = createAdminClient();

  const { error: claimError } = await admin
    .from("paddle_webhook_events")
    .insert({ event_id: event.eventId, event_type: event.eventType });
  if (claimError) {
    if ((claimError as { code?: string }).code === "23505") return; // already processed
    throw claimError;
  }

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
      await syncSubscription(event as SubscriptionEvent, admin);
      return;
    default:
      return; // subscribed-but-unhandled event: no-op
  }
}

/** Find the app user (subscriptions.owner) a Paddle subscription belongs to. */
async function resolveOwner(sub: SubscriptionEvent["data"], admin: Admin): Promise<string | null> {
  const custom = (sub.customData ?? null) as Record<string, unknown> | null;
  const fromCheckout = custom?.userId ?? custom?.user_id;
  if (typeof fromCheckout === "string" && fromCheckout) return fromCheckout;

  // Fallback for events without customData (e.g. changes made in the dashboard):
  // reuse the owner already linked to this subscription or customer.
  const { data } = await admin
    .from("subscriptions")
    .select("owner")
    .or(`paddle_sub_id.eq.${sub.id},paddle_customer_id.eq.${sub.customerId}`)
    .limit(1)
    .maybeSingle();
  return data?.owner ?? null;
}

async function syncSubscription(event: SubscriptionEvent, admin: Admin): Promise<void> {
  const sub = event.data;
  const owner = await resolveOwner(sub, admin);
  if (!owner) {
    // Can't attribute this subscription to a user. Throwing makes Paddle retry;
    // with checkout always passing customData.userId this should not occur.
    throw new Error(`Paddle subscription ${sub.id} has no resolvable owner`);
  }

  const priceId = sub.items?.[0]?.price?.id ?? null;
  // The plan they're subscribed to (stays "pro" even while past_due)...
  const catalogPlan = planForPriceId(priceId) ?? "free";
  // ...versus the access they should actually have right now.
  const effectivePlan = catalogPlan === "pro" && ACTIVE_STATUSES.has(sub.status) ? "pro" : "free";

  const { error } = await admin.from("subscriptions").upsert(
    {
      owner,
      paddle_customer_id: sub.customerId,
      paddle_sub_id: sub.id,
      status: sub.status,
      plan: catalogPlan,
      price_id: priceId,
      current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
      scheduled_change_at: sub.scheduledChange?.effectiveAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner" }
  );
  if (error) throw error;

  // profiles.plan is the flag the rest of the app gates on (parse limits,
  // watermarks, dashboards). Keep it as the effective entitlement so an
  // upgrade/downgrade takes effect everywhere without touching those readers.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ plan: effectivePlan })
    .eq("id", owner);
  if (profileError) throw profileError;
}
