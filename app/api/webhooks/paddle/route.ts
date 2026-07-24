import { createPaddleServer, paddleWebhookSecret } from "@/lib/paddle/server";
import { processPaddleEvent } from "@/lib/paddle/process-webhook";

// Never cached or prerendered — every delivery must run fresh.
export const dynamic = "force-dynamic";

/**
 * Paddle webhook receiver. The contract: only a 2xx marks an event delivered,
 * so any failure (bad signature, DB error) returns a non-2xx and Paddle retries
 * on its own schedule. We verify against the raw body — never a re-serialized
 * one — because the signature is computed over the exact bytes Paddle sent.
 */
export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();

  if (!signature || !rawBody) {
    return Response.json({ error: "Missing signature or body" }, { status: 400 });
  }

  try {
    const paddle = createPaddleServer();
    // Throws on bad signature, stale timestamp, or malformed payload.
    const event = await paddle.webhooks.unmarshal(rawBody, paddleWebhookSecret(), signature);
    if (event) await processPaddleEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    // One non-2xx for every failure mode. A rotated secret or transient DB error
    // recovers automatically on Paddle's retry; a forged request is harmless.
    console.error("Paddle webhook error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
