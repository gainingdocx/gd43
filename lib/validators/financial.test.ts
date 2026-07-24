import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { financials } from "./financial";
import { makeFreightInvoice, makeLine, makePO } from "./testing";

describe("financial validation", () => {
  it("checks PO line sums and total arithmetic", () => {
    const result = financials(makePO({
      line_items: [makeLine({ amount: 100 }), makeLine({ amount: 50 })],
      subtotal: 150, discount_amount: 10, freight_amount: 20, tax_amount: 14, total_amount: 174,
    }));
    assert.deepEqual(result.map((item) => [item.rule, item.status]), [
      ["amounts.line_sum", "pass"], ["amounts.total", "pass"],
    ]);
  });

  it("fails a contradictory freight charge total", () => {
    const result = financials(makeFreightInvoice({
      charges: [{ line_no: "1", charge_code: "OFR", description: "Ocean freight", container_no: null,
        bl_number: null, quantity: null, uom: null, rate: null, amount: 100, currency: "USD",
        tax_rate: null, tax_amount: null, prepaid_collect: null }],
      subtotal: 125,
    }));
    assert.equal(result[0].status, "fail");
  });
});
