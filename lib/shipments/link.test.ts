import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decideLink } from "./link";
import { makeBL, makeCI, makePL } from "@/lib/validators/testing";
import { normalizeModelOutput } from "@/lib/ai/schemas/extraction-v2";

describe("decideLink", () => {
  it("B/L attaches to the shipment with the same bl_number (normalized)", () => {
    const d = decideLink(
      makeBL({ bl_number: "MAEU 260719-001" }),
      [{ id: "s1", bl_number: "maeu260719001" }],
      []
    );
    assert.deepEqual(d, { action: "attach", shipmentId: "s1" });
  });

  it("B/L with a new bl_number creates a shipment", () => {
    const d = decideLink(makeBL({ bl_number: "MAEU9" }), [{ id: "s1", bl_number: "OTHER" }], []);
    assert.deepEqual(d, { action: "create", bl_number: "MAEU9" });
  });

  it("B/L without a number does nothing", () => {
    assert.deepEqual(decideLink(makeBL(), [], []), { action: "none" });
  });

  it("CI attaches via a packing list that references its invoice number", () => {
    const d = decideLink(
      makeCI({ invoice_no: "INV-100" }),
      [],
      [{ id: "p", shipment_id: "s2", doc_type: "packing_list", invoice_no: null, invoice_ref: "INV 100" }]
    );
    assert.deepEqual(d, { action: "attach", shipmentId: "s2" });
  });

  it("PL attaches via the CI its invoice_ref points to", () => {
    const d = decideLink(
      makePL({ invoice_ref: "INV-100" }),
      [],
      [{ id: "c", shipment_id: "s3", doc_type: "commercial_invoice", invoice_no: "INV100", invoice_ref: null }]
    );
    assert.deepEqual(d, { action: "attach", shipmentId: "s3" });
  });

  it("no match / unshipped counterpart / other docs → none", () => {
    assert.deepEqual(decideLink(makeCI({ invoice_no: "X" }), [], []), { action: "none" });
    assert.deepEqual(
      decideLink(
        makePL({ invoice_ref: "X" }),
        [],
        [{ id: "c", shipment_id: null, doc_type: "commercial_invoice", invoice_no: "X", invoice_ref: null }]
      ),
      { action: "none" }
    );
    const other = { detected_type: "other" as const, fields: { raw: {}, _meta: { detected_type: "other" as const, confidence_flags: [], page_refs: {}, prompt_version: "t", source_languages: [] } } };
    assert.deepEqual(decideLink(other, [], []), { action: "none" });
  });

  it("creates a booking-keyed shipment before a B/L exists", () => {
    const extraction = {
      detected_type: "booking_confirmation" as const,
      fields: { booking_no: "BK-2026-9", service_contract_no: null },
    } as Parameters<typeof decideLink>[0];
    assert.deepEqual(decideLink(extraction, [], []), { action: "create_ref", ref: "BK-2026-9" });
  });

  it("attaches a container event through a connected booking reference", () => {
    const extraction = {
      detected_type: "container_event" as const,
      fields: { container_no: "MSCU6639871", bl_number: null, booking_no: "BK-9" },
    } as Parameters<typeof decideLink>[0];
    const decision = decideLink(extraction, [], [{ id: "b", shipment_id: "s9", doc_type: "booking_confirmation", invoice_no: null, invoice_ref: null, fields: { booking_no: "BK 9" } }]);
    assert.deepEqual(decision, { action: "attach", shipmentId: "s9" });
  });

  it("attaches a later B/L to the booking-keyed shipment instead of creating a duplicate", () => {
    const extraction = makeBL({ bl_number: "BL-9", booking_no: "BK-9" });
    const decision = decideLink(extraction, [], [{ id: "b", shipment_id: "s9", doc_type: "booking_confirmation", invoice_no: null, invoice_ref: null, fields: { booking_no: "BK9" } }]);
    assert.deepEqual(decision, { action: "attach", shipmentId: "s9" });
  });

  it("attaches an invoice through its B/L reference even when no packing list exists", () => {
    const extraction = makeCI({ invoice_no: "INV-9", bl_numbers: ["BL-9"] });
    const decision = decideLink(extraction, [], [{ id: "bl", shipment_id: "s9", doc_type: "bill_of_lading", invoice_no: null, invoice_ref: null, fields: { bl_number: "BL9" } }]);
    assert.deepEqual(decision, { action: "attach", shipmentId: "s9" });
  });

  it("creates a shipment from a MAWB and attaches a HAWB through its master reference", () => {
    const mawb = normalizeModelOutput({ detected_type: "air_waybill", fields: { awb_number: "123-12345675", master_awb_number: "123-12345675", awb_type: "master" } }, "test");
    assert.deepEqual(decideLink(mawb, [], []), { action: "create_ref", ref: "123-12345675" });

    const hawb = normalizeModelOutput({ detected_type: "air_waybill", fields: { awb_number: "HAWB-9", master_awb_number: "123-12345675", house_awb_number: "HAWB-9", awb_type: "house" } }, "test");
    const decision = decideLink(hawb, [], [{ id: "mawb", shipment_id: "air-1", doc_type: "air_waybill", invoice_no: null, invoice_ref: null, fields: { awb_number: "12312345675" } }]);
    assert.deepEqual(decision, { action: "attach", shipmentId: "air-1" });
  });
});
