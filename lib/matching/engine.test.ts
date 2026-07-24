import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runThreeWayMatch } from "./engine";
import { container, makeBL, makeFreightInvoice, makeLine, makePO, party } from "@/lib/validators/testing";

describe("runThreeWayMatch", () => {
  it("matches a PO, B/L and freight invoice using exact business references", () => {
    const result = runThreeWayMatch([
      { id: "po", extraction: makePO({
        po_number: "PO-100", buyer: party("Buyer Ltd"), freight_amount: 1200,
        line_items: [makeLine({ line_no: "1", product_code: "SQ-10", description: "Frozen squid", quantity: 750 })],
      }) },
      { id: "bl", extraction: makeBL({
        bl_number: "COXA04793", purchase_order_refs: ["PO 100"], carrier_name: "MAERSK SEALAND",
        containers: [container("MAEU5665691")],
        cargo: [makeLine({ product_code: "SQ-10", description: "Frozen squid whole", quantity: 750 })],
      }) },
      { id: "fi", extraction: makeFreightInvoice({
        invoice_no: "F-1", purchase_order_refs: ["PO100"], bl_numbers: ["COXA-04793"],
        container_refs: ["MAEU 566569-1"], carrier: party("MAERSK SEALAND"), bill_to: party("Buyer Ltd"),
        subtotal: 1200, total_amount: 1200,
      }) },
    ], undefined, new Date("2026-07-21T00:00:00Z"));

    assert.equal(result.decision, "matched");
    assert.equal(result.counts.fail, 0);
    assert.equal(result.counts.review, 0);
    assert.ok(result.rules.some((item) => item.rule_id === "identity.bl_to_freight_invoice" && item.status === "pass"));
    assert.ok(result.rules.some((item) => item.rule_id === "amount.authorized_freight" && item.status === "pass"));
  });

  it("blocks exact identifier and amount contradictions", () => {
    const result = runThreeWayMatch([
      { id: "po", extraction: makePO({ po_number: "PO-100", freight_amount: 1000 }) },
      { id: "bl", extraction: makeBL({ bl_number: "BL-100", purchase_order_refs: ["PO-999"] }) },
      { id: "fi", extraction: makeFreightInvoice({
        purchase_order_refs: ["PO-888"], bl_numbers: ["BL-200"], subtotal: 1500,
      }) },
    ]);
    assert.equal(result.decision, "blocked");
    assert.ok(result.counts.fail >= 3);
  });

  it("never approves when one of the three evidence roles is missing", () => {
    const result = runThreeWayMatch([
      { id: "po", extraction: makePO({ po_number: "PO-1" }) },
      { id: "bl", extraction: makeBL({ bl_number: "BL-1" }) },
    ]);
    assert.equal(result.decision, "incomplete");
    assert.equal(result.requirements.find((item) => item.role === "invoice")?.present, false);
  });

  it("routes unmatched lines to human review instead of false approval", () => {
    const result = runThreeWayMatch([
      { id: "po", extraction: makePO({ line_items: [makeLine({ product_code: "A1", description: "Copper wire", quantity: 10 })] }) },
      { id: "bl", extraction: makeBL({ cargo: [makeLine({ product_code: "B9", description: "Frozen fish", quantity: 10 })] }) },
      { id: "fi", extraction: makeFreightInvoice() },
    ]);
    assert.equal(result.decision, "review");
    assert.ok(result.rules.some((item) => item.rule_id === "line.po.1.presence"));
  });

  it("reconciles House B/L containers against the referenced Master B/L", () => {
    const result = runThreeWayMatch([
      { id: "master", extraction: makeBL({ bl_number: "MBL-100", bl_level: "master", containers: [container("MAEU5665691")] }) },
      { id: "house", extraction: makeBL({ bl_number: "HBL-22", bl_level: "house", master_bl_number: "MBL 100", containers: [container("MSCU1234566")] }) },
    ]);
    const identity = result.rules.find((item) => item.rule_id === "hierarchy.hbl.house.master_reference");
    const containers = result.rules.find((item) => item.rule_id === "hierarchy.hbl.house.containers");
    assert.equal(identity?.status, "pass");
    assert.equal(containers?.status, "fail");
  });
});
