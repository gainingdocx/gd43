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
  ref: string | null;
  bl_number: string | null;
  house_bl_number?: string | null;
  bill_level?: string | null;
  master_shipment_id?: string | null;
  export_approval_required?: boolean | null;
  created_at: string;
}

export function serializeShipment(
  row: ShipmentRow,
  extra: { documentCount?: number; openCritical?: number; openWarnings?: number } = {}
) {
  const openCritical = extra.openCritical ?? 0;
  return {
    id: row.id,
    object: "shipment" as const,
    reference: row.ref,
    bl_number: row.bl_number,
    house_bl_number: row.house_bl_number ?? null,
    bill_level: row.bill_level ?? "standalone",
    master_shipment_id: row.master_shipment_id ?? null,
    export_approval_required: row.export_approval_required ?? false,
    created_at: row.created_at,
    ...(extra.documentCount !== undefined ? { document_count: extra.documentCount } : {}),
    ...(extra.openCritical !== undefined || extra.openWarnings !== undefined
      ? {
          open_critical: openCritical,
          open_warnings: extra.openWarnings ?? 0,
          // The one field an integration branches on before writing anything
          // into a customer's TMS or ledger. Computed here so every endpoint
          // that serializes a shipment agrees on what "safe" means.
          clear_for_write_back: openCritical === 0,
        }
      : {}),
  };
}
