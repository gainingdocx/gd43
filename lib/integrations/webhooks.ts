import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export async function emitWebhook(
  owner: string,
  eventType: "document.parsed" | "document.failed" | "hs.reviewed" | "charge.alert" | "review.updated" | "export.approval",
  data: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select("id, url, signing_secret, events")
    .eq("owner", owner)
    .eq("enabled", true)
    .contains("events", [eventType]);

  await Promise.all((endpoints ?? []).map(async (endpoint) => {
    const eventId = crypto.randomUUID();
    const body = JSON.stringify({
      id: eventId,
      type: eventType,
      created_at: new Date().toISOString(),
      data,
    });
    let responseStatus: number | null = null;
    let error: string | null = null;
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GainingDocx-Webhooks/1.0",
          "X-GainingDocx-Event": eventType,
          "X-GainingDocx-Delivery": eventId,
          "X-GainingDocx-Signature": `sha256=${await sign(endpoint.signing_secret, body)}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      responseStatus = response.status;
      if (!response.ok) error = `Endpoint returned HTTP ${response.status}`;
    } catch (caught) {
      error = caught instanceof Error ? caught.message.slice(0, 300) : "Delivery failed";
    }
    await admin.from("webhook_deliveries").insert({
      owner,
      endpoint_id: endpoint.id,
      event_type: eventType,
      event_id: eventId,
      status: error ? "failed" : "delivered",
      response_status: responseStatus,
      error,
    });
  }));
}
