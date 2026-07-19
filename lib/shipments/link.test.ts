import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decideLink } from "./link";
import { makeBL, makeCI, makePL } from "@/lib/validators/testing";

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
    const other = { detected_type: "other" as const, fields: { raw: {}, _meta: { detected_type: "other" as const, confidence_flags: [], page_refs: {}, prompt_version: "t" } } };
    assert.deepEqual(decideLink(other, [], []), { action: "none" });
  });
});
