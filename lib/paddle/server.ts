import "server-only";

import { Paddle, Environment } from "@paddle/paddle-node-sdk";

/** Server-side Paddle client. The environment is derived from the API key
 *  prefix (`pdl_sdbx_` = sandbox) so it always matches the key in use. */
export function createPaddleServer() {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is not configured");
  const environment = key.startsWith("pdl_sdbx_") ? Environment.sandbox : Environment.production;
  return new Paddle(key, { environment });
}

export function paddleWebhookSecret() {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET is not configured");
  return secret;
}
