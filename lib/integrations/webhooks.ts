import "server-only";

import { enqueueEvent } from "./delivery";
import type { IntegrationEventType } from "./events";

export { sha256 } from "./crypto";

/**
 * Emit an event to the account's destinations.
 *
 * Thin wrapper over the delivery engine, kept as the app-facing name. Delivery
 * is durable now — one attempt happens inline and anything that fails is
 * retried by the cron sweep until it succeeds or dead-letters — so callers no
 * longer need the customer's endpoint to be up at this exact moment.
 *
 * Never rejects: a broken customer endpoint must not fail the parse, review or
 * approval that produced the event.
 */
export async function emitWebhook(
  owner: string,
  eventType: IntegrationEventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await enqueueEvent(owner, eventType, data);
  } catch (error) {
    console.error("[integrations] event emit failed", eventType, error);
  }
}
