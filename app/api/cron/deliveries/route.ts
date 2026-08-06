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
    const result = await runDueDeliveries(50);
    return Response.json(result);
  } catch (error) {
    // A failed sweep must not look like success: the rows stay `pending` and
    // the next tick retries them, but the log has to say what went wrong.
    console.error("[integrations] delivery sweep failed", error);
    return Response.json({ error: "sweep failed" }, { status: 500 });
  }
}
