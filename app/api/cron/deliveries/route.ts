// The retry sweep.
//
// `enqueueEvent` attempts every delivery once, inline, at the moment the event
// happens. Everything that fails that first attempt is waiting on this route:
// without it the backoff schedule in lib/integrations/delivery.ts describes
// retries that never happen, and a `pending` row sits in the log forever while
// the workspace shows "retrying shortly".
//
// Runs every minute, which is the shortest interval Cloudflare cron offers and
// exactly the first backoff step, so the first retry lands when it is promised.

import { runDueDeliveries } from "@/lib/integrations/delivery";
import { runDueCloudSyncs } from "@/lib/integrations/oauth/sync";

export const maxDuration = 60;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // One sweep sends at most 50 deliveries. At one run a minute that is far
    // above any realistic backlog, and it bounds a single invocation's runtime
    // so a slow endpoint cannot make the sweep miss its next tick.
    const deliveries = await runDueDeliveries(50);

    // Watched folders ride the same tick. They are rate-limited to one poll per
    // connection every five minutes inside `runDueCloudSyncs`, so running them
    // here costs one cheap query a minute rather than a second cron schedule.
    //
    // Settled, not awaited together: a Drive outage must not stop the delivery
    // sweep from reporting what it did.
    const [syncs] = await Promise.allSettled([runDueCloudSyncs(20)]);

    return Response.json({
      ...deliveries,
      cloud_sync: syncs.status === "fulfilled" ? syncs.value : { error: "sync failed" },
    });
  } catch (error) {
    // A failed sweep must not look like success: the rows stay `pending` and
    // the next tick retries them, but the log has to say what went wrong.
    console.error("[integrations] delivery sweep failed", error);
    return Response.json({ error: "sweep failed" }, { status: 500 });
  }
}
