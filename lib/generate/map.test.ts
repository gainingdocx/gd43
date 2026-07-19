import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildDraft,
  ciToPackingList,
  generatableTypes,
  plToCommercialInvoice,
  toShippingInstructions,
} from "./map";

const CI = {
  invoice_no: "INV-100",
  po_no: "PO-9",
  seller: { name: "ACME", address: "12 Harbour Rd", city: "Mumbai", country: "India" },
  buyer: { name: "NORDIC OY", address: null, city: "Helsinki", country: "Finland" },
  line_items: [
    { description: "Plates", packages: 800, cartons: null, net_kg: 9000, gross_kg: 9500, volume_cbm: 40, unit_price: 2.5, amount: 2000 },
    { description: "Bowls", packages: 400, cartons: null, net_kg: 4500, gross_kg: 4800, volume_cbm: 22.7, unit_price: 3, amount: 1200 },
  ],
};

describe("generatableTypes", () => {
  it("maps doc types to allowed drafts", () => {
    assert.deepEqual(generatableTypes("commercial_invoice"), ["packing_list", "shipping_instructions"]);
    assert.deepEqual(generatableTypes("packing_list"), ["commercial_invoice", "shipping_instructions"]);
    assert.deepEqual(generatableTypes("bill_of_lading"), ["shipping_instructions"]);
    assert.deepEqual(generatableTypes("other"), []);
  });
});

describe("ciToPackingList", () => {
  it("copies refs/parties and sums totals from lines (cartons fall back to packages)", () => {
    const pl = ciToPackingList(CI);
    assert.equal(pl.header.find((h) => h.label === "Invoice ref")?.value, "INV-100");
    assert.match(pl.parties[0].value, /ACME\n12 Harbour Rd\nMumbai, India/);
    assert.equal(pl.lines[0].cartons, "800");
    assert.equal(pl.totals.find((t) => t.label === "Total cartons")?.value, "1200");
    assert.equal(pl.totals.find((t) => t.label === "Total gross (kg)")?.value, "14300");
    assert.equal(pl.totals.find((t) => t.label === "Total volume (cbm)")?.value, "62.7");
  });
});

describe("plToCommercialInvoice", () => {
  it("keeps amounts blank when the packing list has none (never invents)", () => {
    const ci = plToCommercialInvoice({
      invoice_ref: "INV-100",
      seller: { name: "ACME" },
      buyer: { name: "NORDIC" },
      line_items: [{ description: "Plates", cartons: 800, gross_kg: 9500 }],
    });
    assert.equal(ci.header.find((h) => h.label === "Invoice no.")?.value, "INV-100");
    assert.equal(ci.totals.find((t) => t.label === "Total amount")?.value, "");
    assert.equal(ci.lines[0].amount, "");
  });
});

describe("toShippingInstructions", () => {
  it("uses B/L routing, containers into notes, printed totals preferred", () => {
    const si = toShippingInstructions(
      {
        bl_number: "MAEU1",
        vessel_name: "MSC ANTWERP",
        voyage_no: "426W",
        shipper: { name: "ACME" },
        consignee: { name: "NORDIC" },
        notify: null,
        port_of_load: { name: "Nhava Sheva", unlocode: "INNSA" },
        port_of_discharge: { name: "Helsinki", unlocode: null },
        containers: [{ container_no: "CSQU3054383", seal_no: "S1", iso_type: "40HC" }],
        cargo: [{ description: "Ceramics", packages: 1200, gross_kg: null }],
        total_packages: 1200,
        total_gross_kg: 36430,
      },
      "bill_of_lading"
    );
    assert.equal(si.header.find((h) => h.label === "Vessel / Voyage")?.value, "MSC ANTWERP 426W");
    assert.equal(si.header.find((h) => h.label === "Port of loading")?.value, "Nhava Sheva (INNSA)");
    assert.match(si.notes, /CSQU3054383 \/ S1 \/ 40HC/);
    assert.equal(si.totals.find((t) => t.label === "Total gross (kg)")?.value, "36430");
    assert.equal(si.parties[0].value, "ACME");
  });

  it("CI-sourced SI uses seller/buyer and leaves routing blank", () => {
    const si = toShippingInstructions(CI, "commercial_invoice");
    assert.equal(si.parties[0].value.startsWith("ACME"), true);
    assert.equal(si.header.find((h) => h.label === "Port of loading")?.value, "");
  });
});

describe("buildDraft", () => {
  it("dispatches by type", () => {
    assert.equal(buildDraft("packing_list", CI, "commercial_invoice").type, "packing_list");
    assert.equal(buildDraft("shipping_instructions", CI, "commercial_invoice").type, "shipping_instructions");
  });
});
