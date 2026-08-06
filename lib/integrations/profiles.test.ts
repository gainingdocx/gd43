// The export profiles are published as working, so they need a test that fails
// if they stop being.
//
// This checks the claim actually made — a well-formed file carrying the
// reviewed values — not conformance to a live Tally or CargoWise tenant, which
// the catalogue is explicit about not claiming.
//
// The fixture's field names come from lib/ai/schemas/extraction-v2.ts, which is
// what the parser really writes into `documents.fields`. An invented shape
// tests the renderers against data they will never see: the first draft of this
// test used `invoice_number` and `shipper_name` and "failed" against perfectly
// correct code.

import assert from "node:assert/strict";
import test from "node:test";

import { canonicalShipment, type DiscrepancyInput, type DocumentInput, type ShipmentInput } from "./canonical";
import { EXPORT_PROFILES, renderProfile } from "./profiles";

const shipment = {
  id: "11111111-1111-1111-1111-111111111111",
  ref: "SHP-2026-0042",
  bl_number: "MEDUX1234567",
  house_bl_number: null,
  bill_level: "standalone",
  master_shipment_id: null,
  created_at: "2026-08-01T00:00:00Z",
} as ShipmentInput;

// Values chosen to break naive implementations: markup and an ampersand that
// must be XML-escaped, a comma and a quote that must be CSV-quoted, and a total
// with decimals that must not be rounded.
const documents = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    doc_type: "freight_invoice",
    status: "parsed",
    source_filename: "invoice.pdf",
    page_count: 1,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    fields: {
      invoice_no: "INV/2026/<0042>",
      invoice_date: "2026-08-01",
      currency: "USD",
      total_amount: 12480.55,
      carrier: { name: 'Ocean & Air Logistics "Pvt" Ltd', address: "Nhava Sheva" },
      bill_to: { name: "Delta Trading, Inc." },
      charges: [
        { description: "Ocean freight", amount: 9800.5, currency: "USD" },
        { description: "THC & documentation", amount: 2680.05, currency: "USD" },
      ],
    },
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    doc_type: "bill_of_lading",
    status: "parsed",
    source_filename: "bl.pdf",
    page_count: 2,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    fields: {
      bl_number: "MEDUX1234567",
      shipper: { name: 'Ocean & Air Logistics "Pvt" Ltd' },
      consignee: { name: "Delta Trading, Inc." },
      port_of_load: { name: "Nhava Sheva", unlocode: "INNSA" },
      port_of_discharge: { name: "Rotterdam", unlocode: "NLRTM" },
      containers: [{ container_no: "CSQU3054383", seal_no: "SEAL-1", gross_weight_kg: 12480 }],
    },
  },
] as unknown as DocumentInput[];

const canonical = canonicalShipment(shipment, documents, [] as DiscrepancyInput[]);

/** Every tag closes in order, and no raw markup survives in text content. */
function xmlWellFormed(xml: string): true | string {
  const stack: string[] = [];
  const tag = /<\/?([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(xml)) !== null) {
    const [raw, name, , selfClose] = match;
    if (raw.startsWith("<?") || raw.startsWith("<!") || selfClose === "/") continue;
    if (raw.startsWith("</")) {
      const open = stack.pop();
      if (open !== name) return `closing </${name}> does not match open <${open ?? "nothing"}>`;
    } else {
      stack.push(name);
    }
  }
  if (stack.length > 0) return `unclosed element(s): ${stack.join(", ")}`;
  if (/[<>]/.test(xml.replace(/<[^>]*>/g, ""))) return "raw < or > survives in text content";
  return true;
}

test("export profiles", async (t) => {
  await t.test("every profile renders a body, a mime type and a caveat", () => {
    for (const profile of EXPORT_PROFILES) {
      const output = renderProfile(profile, canonical);
      assert.ok(output.body.length > 0, `${profile} rendered an empty body`);
      assert.ok(output.mime && output.extension, `${profile} has no mime type or extension`);
      // The notice travels with the file so it is still attached when the file
      // is forwarded to whoever runs the import.
      assert.ok(output.notice.length > 20, `${profile} has no import caveat`);
    }
  });

  await t.test("XML profiles are well formed and escape printed values", () => {
    for (const profile of ["cargowise_universal_xml", "tally_xml"] as const) {
      const { body } = renderProfile(profile, canonical);
      assert.equal(xmlWellFormed(body), true, `${profile} is not well formed`);
      assert.ok(!body.includes("<0042>"), `${profile} leaked raw markup from a printed value`);
      assert.ok(!/&(?!(amp|lt|gt|quot|apos);)/.test(body), `${profile} left a bare ampersand`);
    }
  });

  await t.test("accounting payloads carry the money, the invoice number and the vendor", () => {
    for (const profile of ["quickbooks_bill", "xero_bill", "zoho_books_bill"] as const) {
      const text = renderProfile(profile, canonical).body;
      assert.doesNotThrow(() => JSON.parse(text), `${profile} is not valid JSON`);
      // A bill reaching a ledger with the wrong number on it is the most
      // expensive thing this file can get wrong.
      assert.ok(text.includes("12480.55"), `${profile} lost or rounded the invoice total`);
      // Not the shipment ref: the catalogue promises the invoice number so a
      // duplicate import is detectable.
      assert.ok(text.includes("INV/2026/<0042>"), `${profile} did not carry the invoice number`);
      assert.match(text, /Ocean . Air Logistics/, `${profile} did not resolve a vendor`);
      assert.ok(text.includes("USD"), `${profile} lost the currency`);
    }
  });

  await t.test("CSV quotes separators and doubles embedded quotes", () => {
    const { body } = renderProfile("canonical_csv", canonical);
    const lines = body.trim().split(/\r?\n/);
    assert.ok(lines.length >= 2, "CSV has no data rows");
    assert.ok(body.includes('"Delta Trading, Inc."'), "a value containing a comma was not quoted");
    assert.ok(body.includes('""Pvt""'), "an embedded quote was not doubled");

    const columns = lines[0].split(",").length;
    for (const line of lines) {
      let inQuotes = false;
      let count = 1;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) count += 1;
      }
      assert.equal(count, columns, `a row has ${count} columns, header has ${columns}`);
    }
  });

  await t.test("an open critical discrepancy blocks write-back", () => {
    const blocked = canonicalShipment(shipment, documents, [
      { id: "d1", severity: "red", field: "total_amount", message: "mismatch", value_a: "1", value_b: "2", doc_a: null, doc_b: null, resolved: false },
    ] as unknown as DiscrepancyInput[]);
    assert.equal(blocked.summary.clear_for_write_back, false);
    assert.ok(blocked.summary.open_critical >= 1);
  });
});
