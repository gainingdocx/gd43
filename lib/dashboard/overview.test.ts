import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aggregateQuestionedAmounts, inferShipmentMode, percent } from "./overview.ts";

describe("dashboard overview", () => {
  it("infers air, ocean and mixed shipment evidence", () => {
    assert.equal(inferShipmentMode(["air_waybill", "commercial_invoice"]), "air");
    assert.equal(inferShipmentMode(["bill_of_lading", "packing_list"]), "ocean");
    assert.equal(inferShipmentMode(["air_waybill", "sea_waybill"]), "multimodal");
    assert.equal(inferShipmentMode(["commercial_invoice"]), "multimodal");
  });

  it("keeps financial exposure separated by currency", () => {
    assert.deepEqual(aggregateQuestionedAmounts([
      { questioned_amount: 200, questioned_currency: "usd" },
      { questioned_amount: "50", questioned_currency: "USD" },
      { questioned_amount: 90, questioned_currency: "EUR" },
      { questioned_amount: null, questioned_currency: "USD" },
    ]), [
      { currency: "USD", amount: 250 },
      { currency: "EUR", amount: 90 },
    ]);
  });

  it("returns a safe bounded percentage", () => {
    assert.equal(percent(3, 4), 75);
    assert.equal(percent(5, 4), 100);
    assert.equal(percent(2, 0), 0);
  });
});
