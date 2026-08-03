import "server-only";

import {
  EventName,
  type EventEntity,
  type SubscriptionActivatedEvent,
  type SubscriptionCanceledEvent,
  type SubscriptionCreatedEvent,
  type SubscriptionImportedEvent,
  type SubscriptionPastDueEvent,
  type SubscriptionPausedEvent,
  type SubscriptionResumedEvent,
  type SubscriptionTrialingEvent,
  type SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";

import { createAdminClient } from "@/lib/supabase/admin";
import { planForPriceId } from "./config";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type SubscriptionEvent =
  | SubscriptionActivatedEvent
  | SubscriptionCanceledEvent
  | SubscriptionCreatedEvent
  | SubscriptionImportedEvent
  | SubscriptionPastDueEvent
  | SubscriptionPausedEvent
  | SubscriptionResumedEvent
  | SubscriptionTrialingEvent
  | SubscriptionUpdatedEvent;

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Process a verified Paddle event. Subscription state, the profile entitlement,
 * and the event ledger are committed atomically by the database function. It
 * also ignores older out-of-order deliveries so stale events cannot regress a
 * customer's access.
 */
export async function processPaddleEvent(event: EventEntity): Promise<void> {
  const admin = createAdminClient();

  switch (event.eventType) {
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionCanceled:
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionImported:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
    case EventName.SubscriptionTrialing:
    case EventName.SubscriptionUpdated:
      await syncSubscription(event as SubscriptionEvent, admin);
      return;
    default:
      return;
  }
}

async function resolveOwner(sub: SubscriptionEvent["data"], admin: Admin): Promise<string | null> {
  const custom = (sub.customData ?? null) as Record<string, unknown> | null;
  const fromCheckout = custom?.userId ?? custom?.user_id;
  if (typeof fromCheckout === "string" && fromCheckout) return fromCheckout;

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
  if (!owner) throw new Error(`Paddle subscription ${sub.id} has no resolvable owner`);

  const priceId = sub.items.map((item) => item.price?.id).find((id) => planForPriceId(id)) ?? null;
  const catalogPlan = planForPriceId(priceId) ?? "free";
  const effectivePlan = catalogPlan !== "free" && ACTIVE_STATUSES.has(sub.status) ? catalogPlan : "free";

  const { error } = await admin.rpc("apply_paddle_subscription_event", {
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_event_occurred_at: event.occurredAt,
    p_owner: owner,
    p_customer_id: sub.customerId,
    p_subscription_id: sub.id,
    p_status: sub.status,
    p_catalog_plan: catalogPlan,
    p_effective_plan: effectivePlan,
    p_price_id: priceId,
    p_current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
    p_scheduled_change_at: sub.scheduledChange?.effectiveAt ?? null,
  });
  if (error) throw error;
}
