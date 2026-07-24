// Trust-Screen field model (BUILD_SPEC §M6.3). Flattens documents.fields
// into ordered, labeled, editable rows and applies edits back by path.
// Paths look like "shipper.name" or "containers[0].container_no".

export interface FieldRow {
  path: string;
  label: string;
  value: string;
  /** 1-based page number from _meta.page_refs, when the model reported one. */
  page: number | null;
  editable: boolean;
}

type Json = Record<string, unknown>;

const BL_ORDER: [string, string][] = [
  ["bl_number", "B/L number"],
  ["bl_level", "B/L level"],
  ["master_bl_number", "Master B/L number"],
  ["house_bl_number", "House B/L number"],
  ["booking_no", "Booking number"],
  ["shipper_reference", "Shipper reference"],
  ["customs_reference", "Customs reference"],
  ["lc_number", "L/C number"],
  ["carrier_name", "Carrier"],
  ["scac", "SCAC"],
  ["shipper.name", "Shipper"],
  ["shipper.address", "Shipper address"],
  ["shipper.city", "Shipper city"],
  ["shipper.postal_code", "Shipper postal code"],
  ["shipper.country", "Shipper country"],
  ["shipper.tax_id", "Shipper tax ID"],
  ["consignee.name", "Consignee"],
  ["consignee.address", "Consignee address"],
  ["consignee.city", "Consignee city"],
  ["consignee.postal_code", "Consignee postal code"],
  ["consignee.country", "Consignee country"],
  ["consignee.tax_id", "Consignee tax ID"],
  ["consignee.to_order", "To order"],
  ["notify.name", "Notify party"],
  ["notify.address", "Notify address"],
  ["notify.city", "Notify city"],
  ["notify.postal_code", "Notify postal code"],
  ["notify.country", "Notify country"],
  ["vessel_name", "Vessel"],
  ["imo_number", "IMO number"],
  ["voyage_no", "Voyage"],
  ["port_of_load.name", "Port of load"],
  ["port_of_load.unlocode", "POL code"],
  ["port_of_discharge.name", "Port of discharge"],
  ["port_of_discharge.unlocode", "POD code"],
  ["place_of_receipt", "Place of receipt"],
  ["place_of_delivery", "Place of delivery"],
  ["shipped_on_board_date", "Shipped on board"],
  ["issue_date", "Issue date"],
  ["issue_place", "Issue place"],
  ["freight_terms", "Freight terms"],
  ["incoterm", "Incoterm"],
  ["cargo_raw_text", "Cargo block (verbatim)"],
  ["total_packages", "Total packages"],
  ["total_net_kg", "Total net (kg)"],
  ["total_gross_kg", "Total gross (kg)"],
  ["total_volume_cbm", "Total volume (cbm)"],
  ["originals_count", "Originals"],
  ["bl_type", "B/L type"],
];

const CI_ORDER: [string, string][] = [
  ["invoice_no", "Invoice number"],
  ["invoice_date", "Invoice date"],
  ["due_date", "Due date"],
  ["po_no", "PO number"],
  ["seller.name", "Seller"],
  ["seller.address", "Seller address"],
  ["buyer.name", "Buyer"],
  ["buyer.address", "Buyer address"],
  ["incoterm", "Incoterm"],
  ["currency", "Currency"],
  ["subtotal", "Subtotal"],
  ["discount_amount", "Discount"],
  ["freight_charge", "Freight"],
  ["insurance", "Insurance"],
  ["tax_amount", "Tax"],
  ["total_amount", "Total amount"],
  ["amount_due", "Amount due"],
  ["payment_terms", "Payment terms"],
  ["lc_number", "L/C number"],
  ["country_of_origin", "Country of origin"],
  ["bank_details", "Bank details"],
];

const PO_ORDER: [string, string][] = [
  ["po_number", "PO number"], ["po_date", "PO date"], ["revision_no", "Revision"],
  ["contract_no", "Contract"], ["buyer.name", "Buyer"], ["buyer.address", "Buyer address"],
  ["seller.name", "Supplier"], ["seller.address", "Supplier address"],
  ["bill_to.name", "Bill to"], ["ship_to.name", "Ship to"], ["ship_to.address", "Ship-to address"],
  ["requested_delivery_date", "Requested delivery"], ["promised_delivery_date", "Promised delivery"],
  ["shipping_method", "Shipping method"], ["incoterm", "Incoterm"],
  ["payment_terms", "Payment terms"], ["currency", "Currency"], ["subtotal", "Subtotal"],
  ["discount_amount", "Discount"], ["freight_amount", "Authorized freight"],
  ["tax_amount", "Tax"], ["total_amount", "PO total"], ["approval_status", "Approval status"],
  ["approved_by", "Approved by"], ["notes", "Notes"],
];

const FREIGHT_INVOICE_ORDER: [string, string][] = [
  ["invoice_no", "Freight invoice number"], ["invoice_date", "Invoice date"], ["due_date", "Due date"],
  ["carrier_invoice_ref", "Carrier invoice ref"], ["carrier.name", "Carrier / vendor"],
  ["carrier.address", "Carrier address"], ["bill_to.name", "Bill to"], ["bill_to.address", "Bill-to address"],
  ["remit_to.name", "Remit to"], ["vessel_name", "Vessel"], ["voyage_no", "Voyage"],
  ["port_of_load.name", "Port of loading"], ["port_of_discharge.name", "Port of discharge"],
  ["service_period_start", "Service from"], ["service_period_end", "Service to"],
  ["currency", "Currency"], ["exchange_rate", "Exchange rate"], ["subtotal", "Subtotal"],
  ["discount_amount", "Discount"], ["tax_amount", "Tax"], ["total_amount", "Invoice total"],
  ["amount_paid", "Amount paid"], ["amount_due", "Amount due"], ["payment_terms", "Payment terms"],
  ["payment_reference", "Payment reference"], ["bank_details", "Bank details"],
];

const GOODS_RECEIPT_ORDER: [string, string][] = [
  ["receipt_no", "Receipt / GRN number"], ["receipt_date", "Receipt date"],
  ["supplier.name", "Supplier"], ["receiver.name", "Receiver"], ["delivery_location", "Delivery location"],
  ["total_received_quantity", "Total received"], ["total_accepted_quantity", "Total accepted"],
  ["total_rejected_quantity", "Total rejected"], ["total_packages", "Total packages"],
  ["total_gross_kg", "Total gross kg"], ["received_by", "Received by"], ["notes", "Notes"],
];

const PL_ORDER: [string, string][] = [
  ["pl_no", "Packing list no."],
  ["date", "Date"],
  ["invoice_ref", "Invoice ref"],
  ["po_no", "PO number"],
  ["seller.name", "Seller"],
  ["buyer.name", "Buyer"],
  ["total_cartons", "Total cartons"],
  ["total_net_kg", "Total net (kg)"],
  ["total_gross_kg", "Total gross (kg)"],
  ["total_volume_cbm", "Total volume (cbm)"],
];

const ARRIVAL_ORDER: [string, string][] = [
  ["notice_no", "Notice number"], ["issue_date", "Issue date"], ["bl_number", "B/L number"],
  ["booking_no", "Booking number"], ["carrier_name", "Carrier"], ["agent.name", "Destination agent"],
  ["consignee.name", "Consignee"], ["notify.name", "Notify party"], ["vessel_name", "Vessel"],
  ["voyage_no", "Voyage"], ["port_of_discharge.name", "Discharge port"],
  ["port_of_discharge.unlocode", "Discharge port code"], ["terminal", "Terminal / CFS"],
  ["eta", "ETA"], ["availability_date", "Availability date"], ["last_free_day", "Last free day"],
  ["pickup_reference", "Pickup / release reference"], ["currency", "Currency"],
  ["freight_due", "Freight due"], ["terminal_charges", "Terminal charges"],
  ["other_charges", "Other charges"], ["total_charges", "Total charges"],
  ["payment_instructions", "Payment instructions"],
];

const BOOKING_ORDER: [string, string][] = [
  ["booking_no", "Booking number"], ["carrier_name", "Carrier"], ["shipper.name", "Shipper"],
  ["service_contract_no", "Service contract"], ["vessel_name", "Vessel"], ["voyage_no", "Voyage"],
  ["place_of_receipt", "Place of receipt"], ["port_of_load.name", "Port of loading"],
  ["port_of_load.unlocode", "POL code"], ["port_of_discharge.name", "Port of discharge"],
  ["port_of_discharge.unlocode", "POD code"], ["place_of_delivery", "Place of delivery"],
  ["etd", "ETD"], ["eta", "ETA"], ["documentation_cutoff", "Documentation cut-off"],
  ["si_cutoff", "Shipping instructions cut-off"], ["vgm_cutoff", "VGM cut-off"],
  ["cargo_cutoff", "Cargo cut-off"], ["commodity", "Commodity"],
  ["total_packages", "Total packages"], ["total_gross_kg", "Total gross kg"],
  ["special_instructions", "Special instructions"],
];

const AWB_ORDER: [string, string][] = [
  ["awb_number", "Air waybill number"], ["awb_type", "AWB level"],
  ["master_awb_number", "Master AWB number"], ["house_awb_number", "House AWB number"],
  ["airline_name", "Airline"], ["airline_prefix", "Airline prefix"],
  ["shipper.name", "Shipper"], ["shipper.address", "Shipper address"],
  ["consignee.name", "Consignee"], ["consignee.address", "Consignee address"],
  ["issuing_carrier_agent.name", "Issuing carrier agent"], ["issuing_carrier_agent.address", "Agent address"],
  ["origin_airport", "Origin airport"], ["destination_airport", "Destination airport"],
  ["flight_no", "Flight number"], ["flight_date", "Flight date"],
  ["issue_date", "Issue date"], ["issue_place", "Issue place"],
  ["currency", "Currency"], ["charge_code", "Charge code"],
  ["declared_value_carriage", "Declared value for carriage"],
  ["declared_value_customs", "Declared value for customs"],
  ["insurance_amount", "Insurance amount"], ["handling_information", "Handling information"],
  ["total_pieces", "Total pieces"], ["total_gross_kg", "Total gross kg"],
  ["total_chargeable_kg", "Total chargeable kg"], ["total_prepaid", "Total prepaid"],
  ["total_collect", "Total collect"],
];

const ORDERS: Record<string, [string, string][]> = {
  bill_of_lading: BL_ORDER,
  sea_waybill: BL_ORDER,
  commercial_invoice: CI_ORDER,
  purchase_order: PO_ORDER,
  freight_invoice: FREIGHT_INVOICE_ORDER,
  goods_receipt: GOODS_RECEIPT_ORDER,
  packing_list: PL_ORDER,
  arrival_notice: ARRIVAL_ORDER,
  booking_confirmation: BOOKING_ORDER,
  air_waybill: AWB_ORDER,
};

function tokenize(path: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  for (const part of path.split(".")) {
    const m = part.match(/^([^[]+)((\[\d+\])*)$/);
    if (!m) return [];
    tokens.push(m[1]);
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) tokens.push(Number(idx[1]));
  }
  return tokens;
}

export function getPath(fields: Json, path: string): unknown {
  let cur: unknown = fields;
  for (const t of tokenize(path)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[t];
  }
  return cur;
}

/** Immutable set; creates intermediate objects when a party was null. */
export function setPath(fields: Json, path: string, value: unknown): Json {
  const tokens = tokenize(path);
  if (tokens.length === 0) return fields;
  const clone = (x: unknown): unknown =>
    Array.isArray(x) ? [...x] : x !== null && typeof x === "object" ? { ...(x as Json) } : x;
  const root = clone(fields) as Json;
  let cur: Record<string | number, unknown> = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    const next = clone(cur[t]);
    cur[t] =
      next !== null && typeof next === "object"
        ? next
        : typeof tokens[i + 1] === "number"
          ? []
          : {};
    cur = cur[t] as Record<string | number, unknown>;
  }
  cur[tokens[tokens.length - 1]] = value;
  return root;
}

function display(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

/** Page ref for a path: _meta.page_refs is keyed by top-level field name. */
function pageFor(fields: Json, path: string): number | null {
  const meta = fields._meta as { page_refs?: Record<string, number> } | undefined;
  const top = path.split(/[.[]/)[0];
  const n = meta?.page_refs?.[top];
  return typeof n === "number" ? n : null;
}

export function flattenFields(docType: string, fields: Json): FieldRow[] {
  const order = ORDERS[docType];
  if (!order) {
    // "other" docs: show raw keys read-only.
    const raw = (fields.raw ?? {}) as Json;
    return Object.entries(raw)
      .filter(([, v]) => typeof v !== "object" || v === null)
      .slice(0, 40)
      .map(([k, v]) => ({
        path: `raw.${k}`,
        label: k.replace(/_/g, " "),
        value: display(v),
        page: null,
        editable: false,
      }));
  }
  const rows: FieldRow[] = order.map(([path, label]) => ({
    path,
    label,
    value: display(getPath(fields, path)),
    page: pageFor(fields, path),
    editable: true,
  }));

  const appendStringArray = (key: string, label: string) => {
    const values = fields[key];
    if (!Array.isArray(values)) return;
    values.forEach((value, i) => rows.push({
      path: `${key}[${i}]`,
      label: `${label} ${i + 1}`,
      value: display(value),
      page: pageFor(fields, key),
      editable: true,
    }));
  };
  if (docType === "bill_of_lading" || docType === "sea_waybill") {
    appendStringArray("export_references", "Export reference");
    appendStringArray("purchase_order_refs", "PO reference");
    appendStringArray("clauses", "Clause");
  }
  if (["commercial_invoice", "freight_invoice", "goods_receipt"].includes(docType)) {
    appendStringArray("purchase_order_refs", "PO reference");
    appendStringArray("bl_numbers", "B/L reference");
    appendStringArray("booking_refs", "Booking reference");
    appendStringArray("container_refs", "Container reference");
  }
  if (docType === "freight_invoice") appendStringArray("shipment_refs", "Shipment reference");
  if (docType === "goods_receipt") appendStringArray("delivery_note_refs", "Delivery note reference");

  // Container rows (B/L) get appended per container.
  const containers = fields.containers;
  if (Array.isArray(containers)) {
    containers.forEach((c, i) => {
      if (c === null || typeof c !== "object") return;
      rows.push(
        {
          path: `containers[${i}].container_no`,
          label: `Container ${i + 1}`,
          value: display((c as Json).container_no),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].seal_no`,
          label: `Seal ${i + 1}`,
          value: display((c as Json).seal_no),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].iso_type`,
          label: `Equipment size/type ${i + 1}`,
          value: display((c as Json).iso_type),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].packages`,
          label: `Container packages ${i + 1}`,
          value: display((c as Json).packages),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].package_type`,
          label: `Container package type ${i + 1}`,
          value: display((c as Json).package_type),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].gross_kg`,
          label: `Gross kg ${i + 1}`,
          value: display((c as Json).gross_kg),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].tare_kg`,
          label: `Tare kg ${i + 1}`,
          value: display((c as Json).tare_kg),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].volume_cbm`,
          label: `Container volume cbm ${i + 1}`,
          value: display((c as Json).volume_cbm),
          page: pageFor(fields, "containers"),
          editable: true,
        }
      );
    });
  }

  const lineKey = Array.isArray(fields.cargo) ? "cargo" : "line_items";
  const lines = fields[lineKey];
  if (Array.isArray(lines)) {
    const columns: [string, string][] = [
      ["line_no", "Line"], ["product_code", "Product code"], ["buyer_product_code", "Buyer SKU"],
      ["seller_product_code", "Supplier SKU"], ["description", "Description"], ["marks", "Marks"], ["hs_code", "HS code (document)"],
      ["hs_code_suggestion", "Suggested HS code — verify"], ["hs_suggestion_confidence", "HS suggestion confidence"],
      ["hs_suggestion_reason", "HS suggestion reason"], ["us_general_duty_rate", "US general duty rate estimate"],
      ["packages", "Packages"], ["package_type", "Package type"], ["cartons", "Cartons"],
      ["quantity", "Quantity"], ["uom", "Unit"],
      ["net_kg", "Net kg"], ["gross_kg", "Gross kg"], ["volume_cbm", "Volume cbm"],
      ["unit_price", "Unit price"], ["amount", "Amount"], ["currency", "Currency"],
      ["tax_rate", "Tax rate"], ["tax_amount", "Tax amount"], ["discount_amount", "Discount"],
      ["country_of_origin", "Country of origin"], ["lot_no", "Lot / batch"],
      ["chargeable_kg", "Chargeable kg"], ["rate_class", "Rate class"],
      ["rate_charge", "Rate / charge"], ["commodity_item_no", "Commodity item number"],
    ];
    lines.forEach((line, i) => {
      if (line === null || typeof line !== "object") return;
      columns.forEach(([key, label]) => rows.push({
        path: `${lineKey}[${i}].${key}`,
        label: `${lineKey === "cargo" ? "Cargo" : "Line"} ${i + 1} — ${label}`,
        value: display((line as Json)[key]),
        page: pageFor(fields, lineKey),
        editable: true,
      }));
    });
  }
  const charges = fields.charges;
  if (Array.isArray(charges)) {
    const columns: [string, string][] = [
      ["line_no", "Line"], ["charge_code", "Charge code"], ["description", "Description"],
      ["container_no", "Container"], ["bl_number", "B/L"], ["quantity", "Quantity"],
      ["uom", "Unit"], ["rate", "Rate"], ["amount", "Amount"], ["currency", "Currency"],
      ["tax_rate", "Tax rate"], ["tax_amount", "Tax amount"], ["prepaid_collect", "Prepaid / collect"],
    ];
    charges.forEach((charge, i) => {
      if (charge === null || typeof charge !== "object") return;
      columns.forEach(([key, label]) => rows.push({
        path: `charges[${i}].${key}`, label: `Charge ${i + 1} — ${label}`,
        value: display((charge as Json)[key]), page: pageFor(fields, "charges"), editable: true,
      }));
    });
  }
  const equipment = fields.equipment;
  if (Array.isArray(equipment)) {
    equipment.forEach((c, i) => {
      if (c === null || typeof c !== "object") return;
      rows.push({ path: `equipment[${i}].container_no`, label: `Equipment ${i + 1}`, value: display((c as Json).container_no), page: pageFor(fields, "equipment"), editable: true }, { path: `equipment[${i}].iso_type`, label: `Equipment type ${i + 1}`, value: display((c as Json).iso_type), page: pageFor(fields, "equipment"), editable: true });
    });
  }
  const dangerousGoods = fields.dangerous_goods;
  if (Array.isArray(dangerousGoods)) {
    const columns: [string, string][] = [
      ["un_number", "UN number"],
      ["proper_shipping_name", "Proper shipping name"],
      ["hazard_class", "Hazard class"],
      ["subsidiary_risk", "Subsidiary risk"],
      ["packing_group", "Packing group"],
      ["marine_pollutant", "Marine pollutant"],
      ["flash_point_c", "Flash point °C"],
      ["emergency_contact", "Emergency contact"],
    ];
    dangerousGoods.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      columns.forEach(([key, label]) => rows.push({
        path: `dangerous_goods[${index}].${key}`,
        label: `Dangerous goods ${index + 1} — ${label}`,
        value: display((item as Json)[key]),
        page: pageFor(fields, "dangerous_goods"),
        editable: true,
      }));
    });
  }
  return rows;
}

/** Coerce an edited string back to the stored type (numbers stay numbers). */
export function coerceEdit(oldValue: unknown, input: string): unknown {
  const t = input.trim();
  if (t === "") return null;
  if (typeof oldValue === "number" || /^-?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t.replace(/,/g, ""));
    if (Number.isFinite(n) && /^[\d.,\s-]+$/.test(t)) return n;
  }
  return t;
}
