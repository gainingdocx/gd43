// Slack and Microsoft Teams message bodies.
//
// Both accept an incoming-webhook URL that posts an unsigned JSON body, which
// is why they ship before any OAuth app exists: the customer pastes a URL and
// notifications work. The trade-off is that the URL is the only credential, so
// these messages carry a link and the minimum context needed to decide whether
// to click it — never the document contents.
//
// Chat is a summons, not a report. Anyone who can read the channel can read the
// message, and channel membership is not workspace membership.

import type { IntegrationEventType } from "./events";
import { eventDefinition } from "./events";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gainingdocx.com";

interface EventEnvelope {
  id: string;
  type: IntegrationEventType;
  created_at: string;
  data: Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function deepLink(data: Record<string, unknown>): string | null {
  const shipmentId = text(data.shipment_id);
  if (shipmentId) return `${APP_URL}/app/shipments/${shipmentId}`;
  const documentId = text(data.document_id);
  if (documentId) return `${APP_URL}/app/review/${documentId}`;
  return `${APP_URL}/app/shipments`;
}

/** Headline used by both providers, so the two channels read identically. */
export function eventHeadline(event: EventEnvelope): string {
  const { type, data } = event;
  switch (type) {
    case "discrepancy.created":
      return data.severity === "red"
        ? `Critical discrepancy: ${text(data.field) ?? "field mismatch"}`
        : `Discrepancy warning: ${text(data.field) ?? "field mismatch"}`;
    case "document.failed":
      return "Document could not be parsed";
    case "document.review_required":
      return "Document needs review";
    case "document.approved":
      return "Document approved";
    case "charge.alert":
      return `Free time ends in ${text(data.days_remaining) ?? "a few"} day(s)`;
    case "shipment.matched":
      return `Shipment checked: ${text(data.critical) ?? 0} critical, ${text(data.warnings) ?? 0} warning(s)`;
    case "integration.delivery_failed":
      return "Integration delivery failed";
    default:
      return eventDefinition(type)?.summary ?? type;
  }
}

/** Label/value rows a person can act on without opening the workspace. */
function detailRows(event: EventEnvelope): Array<[string, string]> {
  const { data } = event;
  const rows: Array<[string, string]> = [];
  const push = (label: string, value: unknown) => {
    const rendered = text(value);
    if (rendered) rows.push([label, rendered.length > 180 ? `${rendered.slice(0, 177)}…` : rendered]);
  };

  push("Shipment", data.reference ?? data.bl_number ?? data.shipment_id);
  push("Document", data.document_type);
  push("Field", data.field);
  // The two conflicting values are the whole point of a discrepancy alert: a
  // reviewer can often tell from the channel alone which document is wrong.
  push("Value A", data.value_a);
  push("Value B", data.value_b);
  push("Message", data.message ?? data.reason);
  push("Free time until", data.free_until);
  push("Attempts", data.attempts);
  push("Last error", data.last_error);
  return rows.slice(0, 6);
}

export function slackPayload(event: EventEnvelope) {
  const headline = eventHeadline(event);
  const rows = detailRows(event);
  const link = deepLink(event.data);
  const critical = event.type === "document.failed" || event.data.severity === "red" || event.type === "integration.delivery_failed";

  return {
    // `text` is the notification preview and the accessible fallback; Slack
    // shows it on mobile lock screens and in the sidebar, where blocks are not
    // rendered at all.
    text: `${critical ? ":rotating_light: " : ""}${headline}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: headline.slice(0, 150), emoji: true } },
      ...(rows.length > 0
        ? [{
            type: "section",
            fields: rows.map(([label, value]) => ({ type: "mrkdwn", text: `*${label}*\n${value}` })),
          }]
        : []),
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `${event.type} · ${new Date(event.created_at).toUTCString()}` }],
      },
      ...(link
        ? [{
            type: "actions",
            elements: [{
              type: "button",
              text: { type: "plain_text", text: "Open in GainingDocx", emoji: false },
              url: link,
              style: critical ? "danger" : "primary",
            }],
          }]
        : []),
    ],
  };
}

export function teamsPayload(event: EventEnvelope) {
  const headline = eventHeadline(event);
  const rows = detailRows(event);
  const link = deepLink(event.data);
  const critical = event.type === "document.failed" || event.data.severity === "red" || event.type === "integration.delivery_failed";

  // MessageCard rather than an Adaptive Card: incoming webhooks in Teams accept
  // it without a bot registration, an app manifest or tenant admin approval,
  // which is the whole reason a customer can turn this on themselves.
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: headline.slice(0, 150),
    themeColor: critical ? "C0392B" : "1F4E79",
    title: headline,
    sections: [{
      facts: rows.map(([name, value]) => ({ name, value })),
      markdown: false,
      text: eventDefinition(event.type)?.summary ?? "",
    }],
    ...(link
      ? { potentialAction: [{ "@type": "OpenUri", name: "Open in GainingDocx", targets: [{ os: "default", uri: link }] }] }
      : {}),
  };
}
