// Wire formats for API resources.
//
// Database rows are not the API contract. Serializing through explicit shapes
// means a column rename or a new internal field cannot leak into, or silently
// break, a customer integration — and `owner` never crosses the wire at all.

export interface DocumentRow {
  id: string;
  shipment_id: string | null;
  doc_type: string;
  status: string;
  page_count: number | null;
  source_filename?: string | null;
  fields?: unknown;
  validation?: unknown;
  created_at: string;
  updated_at: string;
}

export function serializeDocument(row: DocumentRow, opts: { expand?: boolean } = {}) {
  return {
    id: row.id,
    object: "document" as const,
    shipment_id: row.shipment_id,
    document_type: row.doc_type,
    status: row.status,
    page_count: row.page_count,
    source_filename: row.source_filename ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Field data can be large, so lists omit it and the retrieve endpoint
    // includes it. Same resource, two densities.
    ...(opts.expand ? { fields: row.fields ?? null, validation: row.validation ?? null } : {}),
  };
}

export interface ShipmentRow {
  id: string;
  reference: string | null;
  status: string | null;
  mode?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export function serializeShipment(row: ShipmentRow, extra: { documentCount?: number } = {}) {
  return {
    id: row.id,
    object: "shipment" as const,
    reference: row.reference,
    status: row.status,
    mode: row.mode ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    ...(extra.documentCount !== undefined ? { document_count: extra.documentCount } : {}),
  };
}
