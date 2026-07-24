import { emitWebhook } from "@/lib/integrations/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const DAY_MS = 86_400_000;

function daysUntil(date: string, today: Date): number {
  const target = new Date(`${date}T00:00:00Z`);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

async function sendEmail(alert: {
  notify_email: string | null;
  alert_type: string;
  free_until: string;
  shipment_id: string;
}, days: number): Promise<"sent" | "not_configured" | "failed"> {
  if (!process.env.RESEND_API_KEY || !alert.notify_email) return "not_configured";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "GainingDocx Alerts <alerts@gainingdocx.com>",
      to: [alert.notify_email],
      subject: days === 0 ? "Free time ends today" : `${days} day${days === 1 ? "" : "s"} until charges may begin`,
      html: `<h2>${days === 0 ? "Last free day is today" : `${days} day${days === 1 ? "" : "s"} remaining`}</h2><p>The ${alert.alert_type} free-time date for shipment ${alert.shipment_id.slice(0, 8)} is <strong>${alert.free_until}</strong>.</p><p><a href="https://gainingdocx.com/app/shipments/${alert.shipment_id}">Review the shipment</a></p><p>Confirm the date and applicable carrier terms before operational use.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok ? "sent" : "failed";
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date();
  const { data: alerts, error } = await admin.from("charge_alerts")
    .select("id, owner, shipment_id, document_id, alert_type, free_until, notify_email, remind_days, sent_offsets")
    .eq("status", "active")
    .gte("free_until", new Date(today.getTime() - DAY_MS).toISOString().slice(0, 10))
    .lte("free_until", new Date(today.getTime() + 8 * DAY_MS).toISOString().slice(0, 10));
  if (error) return Response.json({ error: "alert query failed" }, { status: 500 });
  let delivered = 0;
  for (const alert of alerts ?? []) {
    const days = daysUntil(alert.free_until, today);
    if (!(alert.remind_days ?? []).includes(days) || (alert.sent_offsets ?? []).includes(days)) continue;
    const emailStatus = await sendEmail(alert, days);
    await emitWebhook(alert.owner, "charge.alert", {
      alert_id: alert.id,
      shipment_id: alert.shipment_id,
      document_id: alert.document_id,
      alert_type: alert.alert_type,
      free_until: alert.free_until,
      days_remaining: days,
      email_status: emailStatus,
    });
    await admin.from("events").insert({
      owner: alert.owner,
      type: "charge_alert_reminder",
      payload: { alert_id: alert.id, shipment_id: alert.shipment_id, days_remaining: days, email_status: emailStatus },
    });
    await admin.from("charge_alerts").update({ sent_offsets: [...(alert.sent_offsets ?? []), days] }).eq("id", alert.id);
    delivered++;
  }
  return Response.json({ checked: alerts?.length ?? 0, delivered });
}

