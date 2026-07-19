import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { coerceCorrection, correctionPath } from "./resolve";

describe("correctionPath", () => {
  it("routes party names by losing doc type", () => {
    assert.equal(correctionPath("shipper/seller", "bill_of_lading"), "shipper.name");
    assert.equal(correctionPath("shipper/seller", "commercial_invoice"), "seller.name");
    assert.equal(correctionPath("consignee/buyer", "bill_of_lading"), "consignee.name");
    assert.equal(correctionPath("consignee/buyer", "packing_list"), "buyer.name");
    assert.equal(correctionPath("seller", "packing_list"), "seller.name");
    assert.equal(correctionPath("buyer", "commercial_invoice"), "buyer.name");
  });

  it("maps totals to the right column per type", () => {
    assert.equal(correctionPath("total_packages", "packing_list"), "total_cartons");
    assert.equal(correctionPath("total_packages", "bill_of_lading"), "total_packages");
    assert.equal(correctionPath("total_gross_kg", "packing_list"), "total_gross_kg");
    assert.equal(correctionPath("total_gross_kg", "commercial_invoice"), null);
  });

  it("set-valued or ambiguous fields do not auto-write", () => {
    assert.equal(correctionPath("containers", "packing_list"), null);
    assert.equal(correctionPath("port_of_load", "bill_of_lading"), null);
    assert.equal(correctionPath("invoice_date", "bill_of_lading"), null);
    assert.equal(correctionPath("invoice_date", "commercial_invoice"), "invoice_date");
  });
});

describe("coerceCorrection", () => {
  it("numbers for weight/count paths, strings elsewhere", () => {
    assert.equal(coerceCorrection("total_gross_kg", "36,430"), 36430);
    assert.equal(coerceCorrection("total_cartons", "1200"), 1200);
    assert.equal(coerceCorrection("seller.name", "ACME"), "ACME");
  });
});
