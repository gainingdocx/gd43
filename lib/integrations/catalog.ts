// The integration catalogue.
//
// One list, read by the public /integrations page, the `/v1/integrations`
// endpoint and the in-app connection UI. Everything a customer is told about an
// integration comes from here, which is the only way the three surfaces cannot
// disagree.
//
// The rule for adding an entry: state what the connector does *today*. A
// connector that reaches a customer's system only because they wrote code
// against our webhook is `via_api`, not `live`. A connector that needs a
// CargoWise partner to deploy is `partner`, not `live`. Getting this wrong
// costs more than shipping slowly does — a customer who buys on a `live` label
// and finds a roadmap has been mis-sold, and they tell people.

import type { ConnectorDeclaration, ConnectorStatus } from "./connector";

export const STATUS_LABELS: Record<ConnectorStatus, string> = {
  live: "Live",
  beta: "Beta",
  planned: "Planned",
  via_api: "Available via API",
  partner: "Partner-assisted",
};

export const STATUS_BLURBS: Record<ConnectorStatus, string> = {
  live: "Built, tested and available to configure yourself today.",
  beta: "Working and in use, with rough edges we will tell you about before you rely on it.",
  planned: "Not built. Listed so you can plan and tell us if you need it sooner.",
  via_api: "Reachable today through our signed webhook or structured export, using your own code or an automation platform.",
  partner: "Deployed with your integration partner or middleware, because writing into this system unsupervised is not safe.",
};

export const CATEGORY_LABELS = {
  email: "Email",
  cloud_storage: "Cloud storage",
  tms: "TMS and forwarding systems",
  accounting: "Accounting",
  visibility: "Shipment visibility",
  collaboration: "Collaboration",
  automation: "Automation platforms",
  developer: "Developer tools",
} as const;

const RETRY_STANDARD = "Six attempts over about seven hours (1m, 5m, 15m, 1h, 6h), then dead-lettered for manual replay.";
const RETRY_NONE = "Not applicable — generated on request rather than delivered.";
const IDEMPOTENT_EVENT = "Every delivery carries a stable Idempotency-Key; a retry repeats the original body byte for byte.";

export const INTEGRATION_CATALOG: readonly ConnectorDeclaration[] = [
  // -------------------------------------------------------------------------
  // Developer / generic — the foundation everything else is built on.
  // -------------------------------------------------------------------------
  {
    id: "signed_webhook",
    provider: "Signed HTTPS webhook",
    category: "developer",
    status: "live",
    access: "outbound_only",
    summary: "Push every document, matching and review event to your own endpoint, signed so you can prove it came from us.",
    triggers: [
      "document.received", "document.parsing_started", "document.parsed", "document.failed",
      "document.review_required", "document.approved", "document.corrected",
      "shipment.created", "shipment.matched", "discrepancy.created", "discrepancy.resolved",
      "report.generated", "integration.delivery_failed", "charge.alert", "review.updated", "export.approval",
    ],
    actions: ["POST a signed JSON event to your endpoint", "Retry automatically on failure", "Replay any delivery by hand"],
    dataTransmitted: ["Event type and id", "Shipment and document identifiers", "Discrepancy field names and both conflicting values", "No document images or file contents"],
    requiredPlan: "pro",
    setup: "self_serve",
    rateLimit: "No cap on outbound events; one in-flight delivery per destination.",
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    docsPath: "/developers#webhooks",
  },
  {
    id: "rest_api",
    provider: "REST API",
    category: "developer",
    status: "live",
    access: "read_write",
    summary: "Parse documents, read shipments and discrepancies, and manage destinations from your own code.",
    triggers: [],
    actions: ["Parse a document", "List and retrieve documents", "List shipments and their discrepancies", "Export a shipment in any mapping profile", "Create, test and inspect destinations"],
    dataTransmitted: ["Whatever your code requests"],
    requiredPlan: "pro",
    setup: "self_serve",
    rateLimit: "30/min on Free, 120/min on Pro, 300/min on Team, per key.",
    retryPolicy: "Client-controlled. 429 responses carry Retry-After.",
    idempotency: "Sending an Idempotency-Key header on a write is honoured for 24 hours.",
    docsPath: "/developers",
  },
  {
    id: "structured_export",
    provider: "Structured export",
    category: "developer",
    status: "live",
    access: "outbound_only",
    summary: "Download or fetch a reviewed shipment as canonical JSON, CSV, or a mapping file shaped for a specific system.",
    triggers: ["document.approved", "shipment.matched", "report.generated"],
    actions: ["Canonical JSON", "Flat CSV", "CargoWise UniversalShipment XML", "Tally voucher XML", "QuickBooks / Xero / Zoho bill payloads"],
    dataTransmitted: ["Reviewed field values", "Discrepancy summary", "Standards crosswalk metadata"],
    requiredPlan: "pro",
    setup: "self_serve",
    retryPolicy: RETRY_NONE,
    idempotency: "Deterministic — the same shipment and profile produce the same file.",
    docsPath: "/developers#exports",
  },

  // -------------------------------------------------------------------------
  // Collaboration — cheapest real value per hour of work.
  // -------------------------------------------------------------------------
  {
    id: "slack",
    provider: "Slack",
    category: "collaboration",
    status: "live",
    access: "outbound_only",
    summary: "Post critical discrepancies, failed parses and free-time deadlines into a channel, with a link back to the evidence.",
    triggers: ["discrepancy.created", "document.failed", "document.review_required", "charge.alert", "document.approved", "integration.delivery_failed"],
    actions: ["Post a formatted message to a channel", "Filter to critical events only", "Deep-link to the shipment"],
    // Stated explicitly because chat channels are read by more people than the
    // workspace is, and a customer needs to know we understand that.
    dataTransmitted: ["Shipment reference", "Field name and both conflicting values", "A link — never document images or file contents"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["incoming-webhook"],
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    docsPath: "/integrations#slack",
  },
  {
    id: "microsoft_teams",
    provider: "Microsoft Teams",
    // Microsoft disabled Office 365 Connectors in Teams during 18-22 May 2026,
    // so the setup this entry describes — channel → Connectors → Incoming
    // Webhook — no longer exists in any tenant. The delivery code and the
    // MessageCard body still work and are kept: the replacement, a Power
    // Automate Workflows webhook, accepts the same payload. But the connector
    // cannot be published until that path is rebuilt and tested against a real
    // tenant, because today a customer following our instructions fails.
    visibility: "internal",
    category: "collaboration",
    status: "live",
    access: "outbound_only",
    summary: "The same channel alerts for Teams, using an incoming webhook so no tenant admin approval is needed.",
    triggers: ["discrepancy.created", "document.failed", "document.review_required", "charge.alert", "document.approved", "integration.delivery_failed"],
    actions: ["Post a card to a channel", "Filter to critical events only", "Deep-link to the shipment"],
    dataTransmitted: ["Shipment reference", "Field name and both conflicting values", "A link — never document images or file contents"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["Incoming Webhook connector"],
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    // Anchors on /integrations are always the entry id — the page derives them
    // rather than keeping a second list that can drift out of step with this one.
    docsPath: "/integrations#microsoft_teams",
  },

  // -------------------------------------------------------------------------
  // Automation platforms — real coverage without building each marketplace app.
  // -------------------------------------------------------------------------
  {
    id: "make",
    provider: "Make",
    category: "automation",
    status: "via_api",
    access: "outbound_only",
    summary: "Trigger any Make scenario from a GainingDocx event using a Custom Webhook module.",
    triggers: ["document.parsed", "document.approved", "discrepancy.created", "shipment.matched"],
    actions: ["Start a scenario", "Route to any of Make's own app modules"],
    dataTransmitted: ["The event body you subscribe to"],
    requiredPlan: "pro",
    setup: "self_serve",
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    docsPath: "/integrations#automation",
  },
  {
    id: "zapier",
    provider: "Zapier",
    category: "automation",
    status: "via_api",
    access: "outbound_only",
    summary: "Trigger a Zap with the Webhooks by Zapier trigger. A listed Zapier app is planned.",
    triggers: ["document.parsed", "document.approved", "discrepancy.created", "shipment.matched"],
    actions: ["Start a Zap", "Route to any Zapier action app"],
    dataTransmitted: ["The event body you subscribe to"],
    requiredPlan: "pro",
    setup: "self_serve",
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    docsPath: "/integrations#automation",
  },
  {
    id: "n8n",
    provider: "n8n",
    category: "automation",
    status: "via_api",
    access: "outbound_only",
    summary: "Self-hosted automation with a Webhook node — useful where documents must not leave your own infrastructure.",
    triggers: ["document.parsed", "document.approved", "discrepancy.created", "shipment.matched"],
    actions: ["Start a workflow", "Verify the HMAC signature in a Function node"],
    dataTransmitted: ["The event body you subscribe to"],
    requiredPlan: "pro",
    setup: "self_serve",
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    docsPath: "/integrations#automation",
  },

  // -------------------------------------------------------------------------
  // Email.
  // -------------------------------------------------------------------------
  {
    id: "email_in",
    provider: "Email intake",
    category: "email",
    status: "live",
    access: "read_only",
    summary: "Forward or copy documents to your private intake address and they are parsed and grouped automatically.",
    triggers: [],
    actions: ["Accept up to 20 attachments per message, within 25 MiB", "Group attachments into one shipment", "Return the result by email"],
    dataTransmitted: ["Inbound only — nothing leaves GainingDocx"],
    requiredPlan: "free",
    setup: "self_serve",
    attachmentLimit: "20 attachments, 25 MiB per message",
    retryPolicy: "Five queue attempts with backoff before the sender is notified.",
    idempotency: "Messages are deduplicated by Message-ID.",
    docsPath: "/app/email-in",
  },
  {
    id: "gmail",
    provider: "Gmail",
    // Hidden until the Google application behind it is registered and its
    // restricted-scope assessment passed. Until then we cannot say when this
    // will work, and a "Planned" badge invites a customer to plan around it.
    visibility: "internal",
    category: "email",
    status: "planned",
    access: "read_only",
    summary: "Watch a label or shared mailbox directly, with thread context and automatic archiving.",
    triggers: [],
    actions: ["Watch a label", "Deduplicate attachments", "Mark processed"],
    dataTransmitted: ["Inbound only"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["gmail.readonly", "gmail.modify"],
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: dedupe by message id.",
  },
  {
    id: "microsoft_365_mail",
    provider: "Microsoft 365 mailbox",
    // Same position as Gmail: needs an Entra application and admin consent
    // nobody has obtained yet.
    visibility: "internal",
    category: "email",
    status: "planned",
    access: "read_only",
    summary: "The same watched-folder intake for Outlook and shared mailboxes, over OAuth rather than a forwarding rule.",
    triggers: [],
    actions: ["Watch a folder", "Deduplicate attachments", "Mark processed"],
    dataTransmitted: ["Inbound only"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["Mail.Read", "Mail.ReadWrite"],
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: dedupe by message id.",
  },

  // -------------------------------------------------------------------------
  // Cloud storage.
  // -------------------------------------------------------------------------
  {
    id: "google_drive",
    provider: "Google Drive",
    // Built and tested against a stub, but never authenticated against Google.
    // Publish this the moment a real connection succeeds — see
    // lib/integrations/oauth/.
    visibility: "internal",
    category: "cloud_storage",
    status: "planned",
    access: "read_write",
    summary: "Watch an incoming folder, then file reviewed documents and their reports into Reviewed or Needs Attention.",
    triggers: ["document.approved", "document.review_required", "report.generated"],
    actions: ["Watch a folder", "Move the file on approval", "Write the JSON and PDF result alongside it"],
    dataTransmitted: ["Original document", "Discrepancy report", "Canonical JSON"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["drive.file"],
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: keyed on file id and revision.",
  },
  {
    id: "onedrive_sharepoint",
    provider: "OneDrive / SharePoint",
    // Registry entry exists; no file client, and no Entra application.
    visibility: "internal",
    category: "cloud_storage",
    status: "planned",
    access: "read_write",
    summary: "The same watched-folder workflow for Microsoft document libraries.",
    triggers: ["document.approved", "document.review_required", "report.generated"],
    actions: ["Watch a library", "Move the file on approval", "Write the result alongside it"],
    dataTransmitted: ["Original document", "Discrepancy report", "Canonical JSON"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["Files.ReadWrite.All", "Sites.ReadWrite.All"],
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: keyed on drive item id and eTag.",
  },
  {
    id: "dropbox",
    provider: "Dropbox",
    // Registry entry exists; no file client, and no Dropbox application.
    visibility: "internal",
    category: "cloud_storage",
    status: "planned",
    access: "read_write",
    summary: "Watched-folder intake and filing for teams working out of Dropbox.",
    triggers: ["document.approved", "document.review_required", "report.generated"],
    actions: ["Watch a folder", "Move the file on approval", "Write the result alongside it"],
    dataTransmitted: ["Original document", "Discrepancy report", "Canonical JSON"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["files.content.read", "files.content.write"],
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: keyed on file id and content hash.",
  },
  {
    id: "sftp",
    provider: "SFTP drop folder",
    // Cannot run on the current stack at all: Workers exposes raw TCP but has
    // no SSH-2/SFTP client, so this needs a different execution target before
    // it can be promised to anyone.
    visibility: "internal",
    category: "cloud_storage",
    status: "planned",
    access: "write_only",
    summary: "Write canonical JSON, CSV or XML into a folder your existing middleware already collects from.",
    triggers: ["document.approved", "shipment.matched", "report.generated"],
    actions: ["Write the export file", "Write the original document", "Write a manifest"],
    dataTransmitted: ["Reviewed export in your chosen profile", "Original document if enabled"],
    requiredPlan: "team",
    setup: "guided",
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: filenames carry the event id.",
  },

  // -------------------------------------------------------------------------
  // Accounting.
  // -------------------------------------------------------------------------
  {
    id: "quickbooks",
    provider: "QuickBooks Online",
    category: "accounting",
    status: "via_api",
    access: "outbound_only",
    summary: "Export an approved freight invoice as a QuickBooks Bill payload today; a one-click connector that creates the draft bill is next.",
    triggers: ["document.approved"],
    actions: ["Generate a Bill payload from a reviewed freight invoice", "Refuse export while a critical discrepancy is open"],
    dataTransmitted: ["Vendor name", "Invoice number, date and currency", "Charge lines and amounts", "Shipment reference"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["com.intuit.quickbooks.accounting"],
    retryPolicy: RETRY_NONE,
    idempotency: "The payload carries the invoice number so a duplicate import is detectable.",
    docsPath: "/integrations#accounting",
  },
  {
    id: "xero",
    provider: "Xero",
    category: "accounting",
    status: "via_api",
    access: "outbound_only",
    summary: "Export an approved freight invoice as a Xero ACCPAY bill, always as DRAFT.",
    triggers: ["document.approved"],
    actions: ["Generate a DRAFT ACCPAY invoice payload", "Refuse export while a critical discrepancy is open"],
    dataTransmitted: ["Contact name", "Invoice number, date and currency", "Line items and amounts", "Container tracking category"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["accounting.transactions", "accounting.contacts"],
    retryPolicy: RETRY_NONE,
    idempotency: "The payload carries the invoice number so a duplicate import is detectable.",
    docsPath: "/integrations#accounting",
  },
  {
    id: "zoho_books",
    provider: "Zoho Books",
    category: "accounting",
    status: "via_api",
    access: "outbound_only",
    summary: "Export an approved freight invoice as a Zoho Books bill payload.",
    triggers: ["document.approved"],
    actions: ["Generate a bill payload", "Refuse export while a critical discrepancy is open"],
    dataTransmitted: ["Vendor name", "Bill number, date and currency", "Line items and amounts"],
    requiredPlan: "pro",
    setup: "self_serve",
    scopes: ["ZohoBooks.bills.CREATE"],
    retryPolicy: RETRY_NONE,
    idempotency: "The payload carries the bill number so a duplicate import is detectable.",
    docsPath: "/integrations#accounting",
  },
  {
    id: "tally",
    provider: "Tally",
    category: "accounting",
    status: "live",
    access: "outbound_only",
    summary: "Download a Tally purchase-voucher XML for an approved freight invoice and import it into your company file.",
    triggers: ["document.approved"],
    actions: ["Generate a Purchase voucher XML", "Map charge codes to expense ledgers", "Refuse export while a critical discrepancy is open"],
    dataTransmitted: ["Party ledger name", "Voucher date and reference", "Expense ledger lines and amounts"],
    requiredPlan: "pro",
    setup: "guided",
    retryPolicy: RETRY_NONE,
    // Stated plainly because Tally is a desktop application: pretending it is a
    // cloud API would set an expectation the product cannot meet.
    idempotency: "Tally rejects a voucher whose reference already exists, so a re-import is safe.",
    docsPath: "/integrations#tally",
  },

  // -------------------------------------------------------------------------
  // TMS.
  // -------------------------------------------------------------------------
  {
    id: "cargowise",
    provider: "CargoWise",
    category: "tms",
    status: "partner",
    access: "outbound_only",
    summary: "Generate UniversalShipment XML and send it through your existing eAdaptor route or CargoWise partner.",
    triggers: ["document.approved", "shipment.matched"],
    actions: ["Generate UniversalShipment XML", "Bundle the original documents and the discrepancy report", "Deliver through your approved integration route"],
    dataTransmitted: ["Shipment and bill references", "Parties, ports, vessel and voyage", "Container and packing lines", "Review summary"],
    requiredPlan: "team",
    setup: "partner_assisted",
    retryPolicy: RETRY_STANDARD,
    idempotency: "The DataTarget key is the bill number, so a repeat send updates rather than duplicates.",
    // The honest constraint, stated before the sale rather than during
    // implementation: changing eAdaptor routing blind breaks integrations the
    // customer already depends on.
    partnerNote:
      "We do not reconfigure your eAdaptor routing. Your CargoWise partner or middleware (for example Chain.io) deploys the route; we supply the payload, the field mapping and a testing checklist.",
    docsPath: "/integrations#cargowise",
  },
  {
    id: "magaya",
    provider: "Magaya",
    // Needs a live Magaya tenant to build and test against. Writing it blind
    // from published docs would be the unverified connector this catalogue
    // exists to prevent.
    visibility: "internal",
    category: "tms",
    status: "planned",
    access: "read_write",
    summary: "First native TMS connector: find the shipment, attach documents and the report, and push approved values.",
    triggers: ["document.approved", "shipment.matched"],
    actions: ["Find a shipment by reference", "Attach the original document", "Attach the discrepancy report", "Add an internal note", "Update references"],
    dataTransmitted: ["Shipment references", "Approved field values", "Original documents and report"],
    requiredPlan: "team",
    setup: "guided",
    // Financial writes stay off by default even once this ships: a wrong
    // shipment reference is an annoyance, a wrong invoice line is money.
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: external object ids stored against the shipment so a retry updates in place.",
  },
  {
    id: "sap_netsuite_dynamics",
    provider: "SAP / NetSuite / Dynamics",
    category: "tms",
    status: "partner",
    access: "outbound_only",
    summary: "Delivered through your integration partner or iPaaS using the canonical export, not a direct connector.",
    triggers: ["document.approved", "shipment.matched"],
    actions: ["Canonical JSON or XML export", "Field mapping support"],
    dataTransmitted: ["Reviewed export in your chosen profile"],
    requiredPlan: "team",
    setup: "partner_assisted",
    retryPolicy: RETRY_STANDARD,
    idempotency: IDEMPOTENT_EVENT,
    partnerNote: "Enterprise ERP writes are delivered with your implementation partner. We supply the payload, mapping and testing checklist.",
  },

  // -------------------------------------------------------------------------
  // Visibility.
  // -------------------------------------------------------------------------
  {
    id: "container_tracking",
    provider: "Container tracking (Vizion / SeaRates)",
    // Needs a paid carrier-data subscription before any of it can be built.
    visibility: "internal",
    category: "visibility",
    status: "planned",
    access: "read_only",
    summary: "Compare what the documents say against what the container is actually doing — the ETA on the arrival notice against the live one.",
    triggers: ["document.parsed"],
    actions: ["Subscribe a container or bill to tracking", "Import milestones", "Raise a discrepancy when live ETA diverges from the notice", "Recalculate free-time deadlines"],
    dataTransmitted: ["Container numbers", "Bill of lading or booking number"],
    requiredPlan: "team",
    setup: "guided",
    retryPolicy: RETRY_STANDARD,
    idempotency: "Planned: milestones keyed on carrier event id.",
  },
] as const;

/**
 * The entries customers may see.
 *
 * Every public surface — the marketplace page, `/v1/integrations`, site search —
 * reads through this, never `INTEGRATION_CATALOG` directly. One filter in one
 * place is the only way an `internal` connector cannot leak out of a surface
 * someone forgot to update.
 */
export function publicCatalog(): readonly ConnectorDeclaration[] {
  return INTEGRATION_CATALOG.filter((entry) => entry.visibility !== "internal");
}

/**
 * Look up one entry.
 *
 * Searches the public list only, so an internal id is `null` here exactly as an
 * unknown id is — a caller asking about a hidden connector learns nothing about
 * whether it exists.
 */
export function catalogEntry(id: string): ConnectorDeclaration | null {
  return publicCatalog().find((entry) => entry.id === id) ?? null;
}

export function catalogByCategory() {
  const visible = publicCatalog();
  return (Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>)
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      entries: visible.filter((entry) => entry.category === category),
    }))
    // A category whose only members are hidden disappears rather than
    // rendering an empty heading.
    .filter((group) => group.entries.length > 0);
}

/** Headline counts for the marketplace page. Derived, never hand-written. */
export function catalogCounts() {
  const visible = publicCatalog();
  const count = (status: ConnectorStatus) => visible.filter((entry) => entry.status === status).length;
  return {
    live: count("live"),
    beta: count("beta"),
    via_api: count("via_api"),
    partner: count("partner"),
    planned: count("planned"),
    total: visible.length,
  };
}
