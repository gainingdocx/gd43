// The connector contract.
//
// Every integration — the generic webhook, a cloud drive, Magaya, an accounting
// system — implements this one interface and publishes one declaration. Two
// reasons, both learned the expensive way by products that skipped it:
//
//   1. Without a shared interface, each connector invents its own idea of
//      "find the shipment" and "attach the document", and connector number six
//      is a rewrite rather than an addition.
//   2. Without a machine-readable declaration, the marketplace page becomes a
//      logo wall where every logo means "possible via API". A customer cannot
//      tell what a connector will actually do, so they assume the most, and the
//      support burden lands on the gap between assumption and reality.
//
// The declaration is therefore the source of truth for the public integrations
// page, the `/v1/integrations` endpoint and the in-app connection UI. If a
// capability is not declared here, it is not advertised anywhere.

import type { CanonicalShipment } from "./canonical";
import type { IntegrationEventType } from "./events";

/**
 * Release state, in the customer's terms rather than ours.
 *
 * `via_api` is the honest label for "you can do this today, by writing code
 * against our webhook or export" — it is a real capability and it is not a
 * native connector, and conflating the two is the over-claim this file exists
 * to prevent.
 */
export type ConnectorStatus = "live" | "beta" | "planned" | "via_api" | "partner";

export type ConnectorCategory =
  | "email"
  | "cloud_storage"
  | "tms"
  | "accounting"
  | "visibility"
  | "collaboration"
  | "automation"
  | "developer";

/** What the connector is permitted to do in the customer's system. */
export type ConnectorAccess = "read_only" | "read_write" | "write_only" | "outbound_only";

export type SetupDifficulty = "self_serve" | "guided" | "partner_assisted";

export interface ConnectorDeclaration {
  id: string;
  provider: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  access: ConnectorAccess;
  /** One sentence a freight operator would recognise, not a feature list. */
  summary: string;
  /** Events that can start this connector's work. */
  triggers: readonly IntegrationEventType[];
  /** What it does in the external system, in plain language. */
  actions: readonly string[];
  /** Exactly what leaves GainingDocx. Customers ask this first. */
  dataTransmitted: readonly string[];
  requiredPlan: "free" | "pro" | "team";
  setup: SetupDifficulty;
  /** OAuth scopes or equivalent permissions the customer must grant. */
  scopes?: readonly string[];
  /** Provider-imposed ceiling we throttle against, if one is published. */
  rateLimit?: string;
  retryPolicy: string;
  idempotency: string;
  attachmentLimit?: string;
  docsPath?: string;
  /** Set only where a connector cannot be self-served. */
  partnerNote?: string;
  /**
   * Whether customers are shown this entry at all.
   *
   * `internal` means the declaration and its code exist but nothing about it is
   * published — not the marketplace page, not `/v1/integrations`, not search.
   * It is for connectors that are built or half-built but cannot yet be
   * delivered, usually because the OAuth application behind them has not been
   * registered and approved.
   *
   * This is deliberately distinct from `status: "planned"`. Planned is a public
   * promise: "we have not built this, tell us if you need it". When we cannot
   * yet say when something will work, even that promise is more than we can
   * honour, and the honest move is silence rather than a roadmap entry the
   * customer might plan around. Omitted means public.
   */
  visibility?: "public" | "internal";
}

export interface ConnectionHealth {
  ok: boolean;
  checkedAt: string;
  status: number | null;
  message: string | null;
}

export interface ExternalReference {
  /** The id the external system assigned. Stored so later calls can address it. */
  externalId: string;
  system: string;
  url?: string | null;
}

export interface DocumentPayload {
  documentId: string;
  filename: string;
  contentType: string;
  body: Uint8Array | string;
}

export interface DeliveryResult {
  delivered: boolean;
  status: number | null;
  error: string | null;
  externalId?: string | null;
}

export interface IntegrationEvent {
  id: string;
  type: IntegrationEventType;
  created_at: string;
  data: Record<string, unknown>;
}

/**
 * The operations a connector may implement.
 *
 * Only `declaration`, `testConnection` and `deliverEvent` are required. The
 * rest are optional because a Slack channel genuinely cannot create a shipment,
 * and forcing every connector to stub methods it will never support produces
 * exactly the "supported, but throws" surface that makes a marketplace
 * untrustworthy. What a connector omits, its declaration does not advertise.
 */
export interface FreightConnector {
  readonly declaration: ConnectorDeclaration;
  testConnection(): Promise<ConnectionHealth>;
  deliverEvent(event: IntegrationEvent): Promise<DeliveryResult>;
  findShipment?(query: { reference?: string | null; blNumber?: string | null; bookingNo?: string | null }): Promise<ExternalReference | null>;
  createShipment?(shipment: CanonicalShipment): Promise<ExternalReference>;
  updateShipment?(reference: ExternalReference, shipment: CanonicalShipment): Promise<void>;
  uploadDocument?(reference: ExternalReference, document: DocumentPayload): Promise<void>;
  createBill?(shipment: CanonicalShipment): Promise<ExternalReference>;
}

/**
 * Guard every write behind the review state.
 *
 * A connector must call this before it writes anything to a customer's system.
 * Pushing a shipment with an unresolved critical discrepancy would defeat the
 * entire product: the point is to catch the error *before* it reaches the TMS,
 * the customs filing or the payment run.
 */
export function assertClearForWriteBack(shipment: CanonicalShipment): void {
  if (!shipment.summary.clear_for_write_back) {
    throw new Error(
      `Shipment ${shipment.shipment.id} has ${shipment.summary.open_critical} unresolved critical discrepancy(ies). ` +
        "Resolve them before writing to an external system."
    );
  }
}
