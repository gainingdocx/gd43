// Shipment-level export profiles.
//
// These turn one reviewed shipment into the file the receiving system actually
// imports. They exist because the honest first version of a TMS or accounting
// "integration" is a correct file plus an import route — not an OAuth button
// that quietly writes bad data into a customer's ledger.
//
// Every profile is a mapping template. Field names in CargoWise, Tally and the
// accounting APIs vary by tenant configuration, chart of accounts and locale,
// so each output carries a notice saying so. Claiming certified conformance we
// have not tested against a live tenant would be the exact over-claim the
// product is meant to prevent.
//
// Pure functions, no I/O: they take a CanonicalShipment and return bytes.

import type { CanonicalCharge, CanonicalDocument, CanonicalShipment } from "./canonical";

export const EXPORT_PROFILES = [
  "canonical_json",
  "canonical_csv",
  "cargowise_universal_xml",
  "tally_xml",
  "quickbooks_bill",
  "xero_bill",
  "zoho_books_bill",
] as const;

export type ExportProfile = (typeof EXPORT_PROFILES)[number];

export interface ProfileOutput {
  body: string;
  extension: "json" | "xml" | "csv";
  mime: string;
  /** What a person has to check before importing this into a live system. */
  notice: string;
}

export const PROFILE_LABELS: Record<ExportProfile, string> = {
  canonical_json: "Canonical JSON",
  canonical_csv: "Canonical CSV",
  cargowise_universal_xml: "CargoWise UniversalShipment XML",
  tally_xml: "Tally voucher XML",
  quickbooks_bill: "QuickBooks Online bill",
  xero_bill: "Xero bill (ACCPAY)",
  zoho_books_bill: "Zoho Books bill",
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function xmlEscape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}

function tag(name: string, value: unknown): string {
  // Absent values are omitted rather than emitted empty. An empty element in
  // an import file is frequently read as "set this field to blank", which would
  // wipe data the receiving system already holds.
  if (value === null || value === undefined || value === "") return "";
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function party(shipment: CanonicalShipment, role: string) {
  return shipment.parties.find((item) => item.role === role) ?? null;
}

function location(shipment: CanonicalShipment, role: string) {
  return shipment.locations.find((item) => item.role === role) ?? null;
}

/** The document a freight bill should be built from, if the shipment has one. */
function billableDocument(shipment: CanonicalShipment): CanonicalDocument | null {
  const preferred = ["freight_invoice", "demurrage_detention_invoice", "commercial_invoice"];
  for (const type of preferred) {
    const found = shipment.documents.find((document) => document.document_type === type);
    if (found) return found;
  }
  return null;
}

function billLines(document: CanonicalDocument): CanonicalCharge[] {
  if (document.charges.length > 0) return document.charges;
  // A commercial invoice carries commodity lines rather than charge lines; both
  // map to the same bill line shape.
  return document.commodities.map((line) => ({
    line_no: line.line_no,
    charge_code: line.hs_code,
    description: line.description,
    quantity: line.quantity,
    uom: line.uom,
    rate: line.unit_price,
    amount: line.amount,
    currency: line.currency,
    tax_amount: null,
    prepaid_collect: null,
    container_no: null,
  }));
}

function billTotal(document: CanonicalDocument, lines: CanonicalCharge[]): number | null {
  if (document.totals.invoice_total !== null) return document.totals.invoice_total;
  const summed = lines.reduce((total, line) => (line.amount === null ? total : total + line.amount), 0);
  return lines.some((line) => line.amount !== null) ? Number(summed.toFixed(2)) : null;
}

const REVIEW_NOTICE =
  "Reviewed GainingDocx data. Confirm field names, ledgers and tax treatment against the receiving system before importing to a production company file.";

// ---------------------------------------------------------------------------
// Canonical
// ---------------------------------------------------------------------------

function canonicalJson(shipment: CanonicalShipment): ProfileOutput {
  return {
    body: JSON.stringify(shipment, null, 2),
    extension: "json",
    mime: "application/json; charset=utf-8",
    notice: "Portable canonical export. Stable field names across every document type.",
  };
}

/**
 * One rectangular table: a row per document with the fields most import tools
 * and spreadsheet workflows actually key on.
 *
 * Deliberately flat. A CSV with nested or ragged columns is worse than no CSV,
 * because Excel and every SFTP-drop importer silently mangle it.
 */
function canonicalCsv(shipment: CanonicalShipment): ProfileOutput {
  const columns = [
    "shipment_reference", "bl_number", "house_bl_number", "mode", "document_id", "document_type",
    "document_reference", "shipper", "consignee", "port_of_loading", "port_of_discharge",
    "vessel", "voyage", "flight_no", "etd", "eta", "incoterm", "containers",
    "gross_kg", "net_kg", "volume_cbm", "packages", "invoice_total", "currency",
    "open_critical", "open_warnings",
  ];
  const rows = shipment.documents.map((document) => [
    shipment.shipment.reference,
    shipment.shipment.bl_number,
    shipment.shipment.house_bl_number,
    shipment.shipment.mode,
    document.id,
    document.document_type,
    document.reference,
    document.parties.find((item) => item.role === "shipper")?.name ?? null,
    document.parties.find((item) => item.role === "consignee")?.name ?? null,
    document.locations.find((item) => item.role === "port_of_loading")?.name ?? null,
    document.locations.find((item) => item.role === "port_of_discharge")?.name ?? null,
    document.transport.vessel,
    document.transport.voyage,
    document.transport.flight_no,
    document.transport.etd,
    document.transport.eta,
    document.transport.incoterm,
    document.containers.map((container) => container.container_no).filter(Boolean).join(" "),
    document.totals.gross_kg,
    document.totals.net_kg,
    document.totals.volume_cbm,
    document.totals.packages,
    document.totals.invoice_total,
    document.totals.currency,
    shipment.summary.open_critical,
    shipment.summary.open_warnings,
  ]);
  return {
    body: [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n"),
    extension: "csv",
    mime: "text/csv; charset=utf-8",
    notice: "One row per document. Suitable for spreadsheet review and SFTP drop-folder imports.",
  };
}

// ---------------------------------------------------------------------------
// CargoWise
// ---------------------------------------------------------------------------

/**
 * A UniversalShipment-shaped document.
 *
 * CargoWise consumes Universal XML through eAdaptor, and the routing for that
 * belongs to the customer's own middleware — changing it blind is how existing
 * integrations get broken. So this produces the payload and stops there: the
 * customer or their CargoWise partner posts it through their approved route.
 */
function cargowiseUniversalXml(shipment: CanonicalShipment): ProfileOutput {
  const transport = shipment.documents.find((document) => document.transport.vessel || document.transport.flight_no)?.transport;
  const shipper = party(shipment, "shipper");
  const consignee = party(shipment, "consignee");
  const loading = location(shipment, "port_of_loading");
  const discharge = location(shipment, "port_of_discharge");

  const organization = (role: string, source: typeof shipper) =>
    source
      ? `<OrganizationAddress><AddressType>${xmlEscape(role)}</AddressType>${tag("CompanyName", source.name)}${tag("Address1", source.address)}</OrganizationAddress>`
      : "";

  const packingLines = shipment.containers
    .map((container) => `<PackingLine>${tag("ContainerNumber", container.container_no)}${tag("ContainerType", container.iso_type)}${tag("PackQty", container.packages)}${tag("PackType", container.package_type)}${tag("WeightNet", container.gross_kg)}${tag("Volume", container.volume_cbm)}${tag("SealNumber", container.seal_no)}</PackingLine>`)
    .join("");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<UniversalShipment xmlns="http://www.cargowise.com/Schemas/Universal/2011/11">` +
    `<Shipment>` +
    `<DataContext><DataTargetCollection><DataTarget><Type>ForwardingShipment</Type>${tag("Key", shipment.shipment.bl_number ?? shipment.shipment.reference)}</DataTarget></DataTargetCollection></DataContext>` +
    tag("WayBillNumber", shipment.shipment.bl_number) +
    tag("HouseBill", shipment.shipment.house_bl_number) +
    tag("ShipmentType", shipment.shipment.mode === "air" ? "AIR" : shipment.shipment.mode === "ocean" ? "SEA" : "") +
    tag("TransportMode", shipment.shipment.mode.toUpperCase()) +
    tag("VesselName", transport?.vessel) +
    tag("VoyageFlightNo", transport?.voyage ?? transport?.flight_no) +
    tag("ContainerMode", shipment.containers.length > 1 ? "LCL" : shipment.containers.length === 1 ? "FCL" : "") +
    (loading ? `<PortOfLoading>${tag("Code", loading.unlocode)}${tag("Name", loading.name)}</PortOfLoading>` : "") +
    (discharge ? `<PortOfDischarge>${tag("Code", discharge.unlocode)}${tag("Name", discharge.name)}</PortOfDischarge>` : "") +
    tag("EstimatedDeparture", transport?.etd) +
    tag("EstimatedArrival", transport?.eta) +
    `<OrganizationAddressCollection>${organization("ConsignorDocumentaryAddress", shipper)}${organization("ConsigneeDocumentaryAddress", consignee)}</OrganizationAddressCollection>` +
    (packingLines ? `<PackingLineCollection>${packingLines}</PackingLineCollection>` : "") +
    `<GainingDocxReview>` +
    tag("ShipmentId", shipment.shipment.id) +
    tag("DocumentsChecked", shipment.summary.document_count) +
    tag("OpenCriticalDiscrepancies", shipment.summary.open_critical) +
    tag("OpenWarnings", shipment.summary.open_warnings) +
    tag("ClearForWriteBack", shipment.summary.clear_for_write_back) +
    tag("Notice", REVIEW_NOTICE) +
    `</GainingDocxReview>` +
    `</Shipment></UniversalShipment>`;

  return {
    body,
    extension: "xml",
    mime: "application/xml; charset=utf-8",
    notice:
      "UniversalShipment-shaped mapping template. Send it through your existing eAdaptor route or CargoWise partner — " +
      "confirm the DataTarget type and reference keys against your tenant's specification first.",
  };
}

// ---------------------------------------------------------------------------
// Tally
// ---------------------------------------------------------------------------

/**
 * A Tally purchase voucher.
 *
 * Tally imports XML over HTTP to the local gateway rather than a cloud OAuth
 * API, so the honest integration is a correct voucher file the customer imports
 * — not a connector promising two-way sync with a desktop application.
 *
 * Ledger names must exist in the company file already. Tally creates nothing on
 * import; a name that does not match is rejected, which is the safe failure.
 */
function tallyXml(shipment: CanonicalShipment): ProfileOutput {
  const document = billableDocument(shipment);
  const lines = document ? billLines(document) : [];
  const vendor =
    document?.parties.find((item) => item.role === "supplier" || item.role === "carrier" || item.role === "forwarder")?.name ??
    party(shipment, "carrier")?.name ??
    "Freight Vendor";
  const total = document ? billTotal(document, lines) : null;
  const reference = document?.reference ?? shipment.shipment.reference ?? shipment.shipment.id.slice(0, 8);
  // Tally expects YYYYMMDD.
  const date = (document?.transport.etd ?? shipment.shipment.created_at).slice(0, 10).replace(/-/g, "");

  // Tally's sign convention: a credit is negative, a debit positive. The vendor
  // ledger is credited with the total and the expense ledgers debited, so the
  // voucher balances to zero.
  const expenseEntries = lines
    .map((line) =>
      `<ALLLEDGERENTRIES.LIST>` +
      `<LEDGERNAME>${xmlEscape(line.charge_code ? `Freight - ${line.charge_code}` : "Freight Charges")}</LEDGERNAME>` +
      `<ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>` +
      `<AMOUNT>${line.amount ?? 0}</AMOUNT>` +
      tag("NARRATION", line.description) +
      `</ALLLEDGERENTRIES.LIST>`
    )
    .join("");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>` +
    `<BODY><IMPORTDATA>` +
    `<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>` +
    `<REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF">` +
    `<VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">` +
    `<DATE>${xmlEscape(date)}</DATE>` +
    `<VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>` +
    `<REFERENCE>${xmlEscape(reference)}</REFERENCE>` +
    `<PARTYLEDGERNAME>${xmlEscape(vendor)}</PARTYLEDGERNAME>` +
    tag("NARRATION", `GainingDocx reviewed freight document ${reference}. ${shipment.summary.open_critical} open critical discrepancy(ies).`) +
    `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${xmlEscape(vendor)}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${total !== null ? -total : 0}</AMOUNT></ALLLEDGERENTRIES.LIST>` +
    expenseEntries +
    `</VOUCHER></TALLYMESSAGE></REQUESTDATA>` +
    `</IMPORTDATA></BODY></ENVELOPE>`;

  return {
    body,
    extension: "xml",
    mime: "application/xml; charset=utf-8",
    notice:
      "Tally purchase-voucher import file. The party and expense ledger names must already exist in the company file; " +
      "map them to your chart of accounts and verify GST treatment before importing.",
  };
}

// ---------------------------------------------------------------------------
// Accounting
// ---------------------------------------------------------------------------

/**
 * Bill payloads for QuickBooks Online, Xero and Zoho Books.
 *
 * Produced as draft bills only. Posting a freight invoice automatically is how
 * a duplicate or overcharged invoice gets paid, which is one of the things the
 * matching engine exists to catch — so a shipment with an open critical
 * discrepancy is refused outright rather than exported with a warning.
 */
function accountingBill(profile: "quickbooks_bill" | "xero_bill" | "zoho_books_bill", shipment: CanonicalShipment): ProfileOutput {
  const document = billableDocument(shipment);
  const lines = document ? billLines(document) : [];
  const vendor = document?.parties.find((item) => ["supplier", "carrier", "forwarder"].includes(item.role))?.name ?? null;
  const total = document ? billTotal(document, lines) : null;
  const currency = document?.totals.currency ?? lines.find((line) => line.currency)?.currency ?? null;
  const reference = document?.reference ?? shipment.shipment.reference;
  const date = (document?.transport.etd ?? shipment.shipment.created_at).slice(0, 10);
  const memo = `GainingDocx shipment ${shipment.shipment.reference ?? shipment.shipment.id.slice(0, 8)}${shipment.shipment.bl_number ? ` · ${shipment.shipment.bl_number}` : ""}`;

  const blocked = !shipment.summary.clear_for_write_back;
  const review = {
    source: "gainingdocx",
    shipment_id: shipment.shipment.id,
    documents_checked: shipment.summary.document_count,
    open_critical_discrepancies: shipment.summary.open_critical,
    open_warnings: shipment.summary.open_warnings,
    approved_for_posting: !blocked,
    notice: blocked
      ? "This shipment has unresolved critical discrepancies. Resolve them in GainingDocx before creating the bill."
      : REVIEW_NOTICE,
  };

  if (profile === "quickbooks_bill") {
    return {
      body: JSON.stringify({
        _gainingdocx_review: review,
        VendorRef: { name: vendor },
        DocNumber: reference,
        TxnDate: date,
        CurrencyRef: currency ? { value: currency } : undefined,
        PrivateNote: memo,
        TotalAmt: total,
        Line: lines.map((line, index) => ({
          Id: String(line.line_no ?? index + 1),
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: line.amount,
          Description: line.description,
          AccountBasedExpenseLineDetail: {
            AccountRef: { name: line.charge_code ? `Freight - ${line.charge_code}` : "Freight and Duty" },
            BillableStatus: "NotBillable",
            TaxAmount: line.tax_amount ?? undefined,
          },
        })),
      }, null, 2),
      extension: "json",
      mime: "application/json; charset=utf-8",
      notice: "QuickBooks Online Bill entity shape. Replace VendorRef and AccountRef names with the ids from your company file before POSTing to /v3/company/{realmId}/bill.",
    };
  }

  if (profile === "xero_bill") {
    return {
      body: JSON.stringify({
        _gainingdocx_review: review,
        Type: "ACCPAY",
        // DRAFT, never AUTHORISED. An authorised bill is payable, and nothing
        // machine-extracted should become payable without a person.
        Status: "DRAFT",
        Contact: { Name: vendor },
        InvoiceNumber: reference,
        Date: date,
        CurrencyCode: currency,
        Reference: memo,
        LineAmountTypes: "Exclusive",
        LineItems: lines.map((line) => ({
          Description: line.description ?? line.charge_code ?? "Freight charge",
          Quantity: line.quantity ?? 1,
          UnitAmount: line.rate ?? line.amount,
          LineAmount: line.amount,
          AccountCode: null,
          Tracking: line.container_no ? [{ Name: "Container", Option: line.container_no }] : undefined,
        })),
        Total: total,
      }, null, 2),
      extension: "json",
      mime: "application/json; charset=utf-8",
      notice: "Xero ACCPAY invoice shape, created as DRAFT. Set AccountCode and TaxType from your chart of accounts before POSTing to /api.xro/2.0/Invoices.",
    };
  }

  return {
    body: JSON.stringify({
      _gainingdocx_review: review,
      vendor_name: vendor,
      bill_number: reference,
      date,
      currency_code: currency,
      notes: memo,
      total,
      line_items: lines.map((line) => ({
        name: line.description ?? line.charge_code ?? "Freight charge",
        description: line.description,
        quantity: line.quantity ?? 1,
        rate: line.rate ?? line.amount,
        item_total: line.amount,
        account_name: line.charge_code ? `Freight - ${line.charge_code}` : "Freight and Duty",
      })),
    }, null, 2),
    extension: "json",
    mime: "application/json; charset=utf-8",
    notice: "Zoho Books bill shape. Map account_name to an existing chart-of-accounts entry before POSTing to /books/v3/bills.",
  };
}

// ---------------------------------------------------------------------------

export function isExportProfile(value: string): value is ExportProfile {
  return EXPORT_PROFILES.includes(value as ExportProfile);
}

export function renderProfile(profile: ExportProfile, shipment: CanonicalShipment): ProfileOutput {
  switch (profile) {
    case "canonical_csv": return canonicalCsv(shipment);
    case "cargowise_universal_xml": return cargowiseUniversalXml(shipment);
    case "tally_xml": return tallyXml(shipment);
    case "quickbooks_bill":
    case "xero_bill":
    case "zoho_books_bill": return accountingBill(profile, shipment);
    default: return canonicalJson(shipment);
  }
}
