import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  containersOf,
  countEmptyCriticalFields,
  normalizeModelOutput,
} from "./extraction-v2";

const PV = "extract-v2";

describe("normalizeModelOutput — bill of lading", () => {
  const raw = {
    detected_type: "bill_of_lading",
    confidence_flags: ["vessel_name", 42],
    page_refs: { bl_number: 1, shipper: "1", bogus: 0, other: -2 },
    fields: {
      bl_number: "MAEU260719001",
      shipper: {
        name: "ACME EXPORTS PVT. LTD.",
        address: "12 HARBOUR ROAD",
        city: null,
        country: "INDIA",
        tax_id: null,
      },
      consignee: { name: "NORDIC TRADING OY", to_order: true },
      vessel_name: "MSC ANTWERP",
      voyage_no: "426W",
      port_of_load: "NHAVA SHEVA (JNPT)", // bare string form
      port_of_discharge: { name: "HELSINKI", unlocode: "FIHEL" },
      freight_terms: "PREPAID", // wrong casing
      bl_type: "Original",
      originals_count: "3", // string number
      total_gross_kg: "36,430.00", // formatted string number
      containers: [
        { container_no: "TCLU4837291", gross_kg: "18,450.00", packages: 620 },
        { container_no: "MSCU6639870 / SL908771", packages: 120 },
        { container_no: null }, // all-null row must be dropped
      ],
      line_items: [{ description: "CERAMIC TABLEWARE", packages: 1200 }],
      clauses: ["CLEAN ON BOARD"],
      seller: { name: "SHOULD BE DROPPED" }, // not a B/L key
      invoice_no: "SHOULD BE DROPPED",
    },
  };
  const out = normalizeModelOutput(raw, PV);

  it("keeps the detected type and exact strings", () => {
    assert.equal(out.detected_type, "bill_of_lading");
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.bl_number, "MAEU260719001");
    assert.equal(out.fields.shipper?.name, "ACME EXPORTS PVT. LTD.");
  });

  it("maps line_items to cargo for a B/L and drops foreign keys", () => {
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.cargo[0]?.description, "CERAMIC TABLEWARE");
    assert.equal("seller" in out.fields, false);
    assert.equal("invoice_no" in out.fields, false);
  });

  it("coerces string numbers, enum casing and bare port strings", () => {
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.total_gross_kg, 36430);
    assert.equal(out.fields.originals_count, 3);
    assert.equal(out.fields.freight_terms, "prepaid");
    assert.equal(out.fields.bl_type, "original");
    assert.deepEqual(out.fields.port_of_load, {
      name: "NHAVA SHEVA (JNPT)",
      unlocode: null,
    });
    assert.equal(out.fields.port_of_discharge?.unlocode, "FIHEL");
  });

  it("keeps to_order on the consignee", () => {
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.consignee?.to_order, true);
  });

  it("drops all-null container rows and coerces the rest", () => {
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.containers.length, 2);
    assert.equal(out.fields.containers[0].gross_kg, 18450);
    assert.equal(out.fields.containers[1].container_no, "MSCU6639870");
    assert.equal(out.fields.containers[1].seal_no, "SL908771");
    assert.deepEqual(containersOf(out), out.fields.containers);
  });

  it("builds _meta with sanitized flags and page_refs", () => {
    if (out.detected_type !== "bill_of_lading") return;
    assert.deepEqual(out.fields._meta.confidence_flags, ["vessel_name"]);
    assert.deepEqual(out.fields._meta.page_refs, { bl_number: 1, shipper: 1 });
    assert.equal(out.fields._meta.prompt_version, PV);
  });

  it("counts zero empty critical fields (all present here)", () => {
    assert.equal(countEmptyCriticalFields(out), 0);
  });
});

describe("normalizeModelOutput — dedicated operational document types", () => {
  it("normalizes a sea waybill through the transport-document schema", () => {
    const out = normalizeModelOutput({ detected_type: "sea_waybill", fields: { bl_number: "SWB-77", shipper: { name: "EXPORTER" }, consignee: { name: "IMPORTER" }, port_of_load: { name: "Singapore", unlocode: "SGSIN" }, port_of_discharge: { name: "Helsinki", unlocode: "FIHEL" }, containers: [{ container_no: "MSCU6639870" }], bl_type: "seaway" } }, PV);
    assert.equal(out.detected_type, "sea_waybill");
    if (out.detected_type !== "sea_waybill") return;
    assert.equal(out.fields.bl_type, "seaway");
    assert.equal(out.fields.containers.length, 1);
  });

  it("normalizes arrival-notice charges and equipment", () => {
    const out = normalizeModelOutput({ detected_type: "arrival_notice", fields: { bl_number: "BL-9", carrier_name: "CARRIER", consignee: { name: "BUYER" }, vessel_name: "VESSEL", port_of_discharge: "Helsinki", eta: "20 JUL 2026", terminal_charges: "125.50", total_charges: 125.5, containers: [{ container_no: "MSCU6639870" }] } }, PV);
    assert.equal(out.detected_type, "arrival_notice");
    if (out.detected_type !== "arrival_notice") return;
    assert.equal(out.fields.terminal_charges, 125.5);
    assert.equal(containersOf(out).length, 1);
    assert.equal(countEmptyCriticalFields(out), 0);
  });

  it("normalizes booking cut-offs and equipment", () => {
    const out = normalizeModelOutput({ detected_type: "booking_confirmation", fields: { booking_no: "BK-1", carrier_name: "CARRIER", port_of_load: "Singapore", port_of_discharge: "Helsinki", etd: "21 JUL 2026", documentation_cutoff: "19 JUL 2026 12:00", equipment: [{ iso_type: "40HC", packages: 1 }] } }, PV);
    assert.equal(out.detected_type, "booking_confirmation");
    if (out.detected_type !== "booking_confirmation") return;
    assert.equal(out.fields.documentation_cutoff, "19 JUL 2026 12:00");
    assert.equal(out.fields.equipment[0].iso_type, "40HC");
  });
});

describe("normalizeModelOutput — commercial invoice", () => {
  const out = normalizeModelOutput(
    {
      detected_type: "commercial_invoice",
      fields: {
        invoice_no: "INV-889",
        // seller/buyer supplied under B/L-style keys — must be adopted
        shipper: { name: "SELLER CO" },
        consignee: { name: "BUYER GMBH" },
        currency: "USD",
        total_amount: "12,500.50",
        line_items: [{ description: "WIDGETS", amount: 12500.5 }],
      },
    },
    PV
  );

  it("adopts shipper/consignee as seller/buyer fallback", () => {
    assert.equal(out.detected_type, "commercial_invoice");
    if (out.detected_type !== "commercial_invoice") return;
    assert.equal(out.fields.seller?.name, "SELLER CO");
    assert.equal(out.fields.buyer?.name, "BUYER GMBH");
    assert.equal(out.fields.total_amount, 12500.5);
  });

  it("has zero empty critical fields", () => {
    assert.equal(countEmptyCriticalFields(out), 0);
  });

  it("returns no containers to persist", () => {
    assert.deepEqual(containersOf(out), []);
  });
});

describe("normalizeModelOutput — packing list", () => {
  const out = normalizeModelOutput(
    {
      detected_type: "packing_list",
      fields: {
        pl_no: "PL-1",
        seller: { name: "S" },
        buyer: { name: "B" },
        total_packages: 44, // total_cartons fallback
        total_gross_kg: 900,
        container_refs: ["TCLU4837291", 7],
        line_items: [
          {
            description: "PLATES",
            cartons: "44",
            dims: { l: "40", w: 30, h: 25, unit: "cm" },
          },
        ],
      },
    },
    PV
  );

  it("keeps PL extras: cartons + dims per line, container_refs", () => {
    assert.equal(out.detected_type, "packing_list");
    if (out.detected_type !== "packing_list") return;
    assert.equal(out.fields.total_cartons, 44);
    assert.equal(out.fields.line_items[0].cartons, 44);
    assert.deepEqual(out.fields.line_items[0].dims, {
      l: 40,
      w: 30,
      h: 25,
      unit: "cm",
    });
    assert.deepEqual(out.fields.container_refs, ["TCLU4837291", "7"]);
  });

  it("has zero empty critical fields", () => {
    assert.equal(countEmptyCriticalFields(out), 0);
  });
});

describe("normalizeModelOutput — edge cases", () => {
  it("unknown detected_type becomes 'other' with raw preserved", () => {
    const out = normalizeModelOutput(
      { detected_type: "certificate_of_origin", fields: { foo: "bar" } },
      PV
    );
    assert.equal(out.detected_type, "other");
    if (out.detected_type !== "other") return;
    assert.deepEqual(out.fields.raw, { foo: "bar" });
    assert.equal(countEmptyCriticalFields(out), 0);
  });

  it("throws without a fields object", () => {
    assert.throws(() => normalizeModelOutput({ detected_type: "other" }, PV));
    assert.throws(() => normalizeModelOutput("nope", PV));
  });

  it("counts empty critical fields on a sparse B/L", () => {
    const out = normalizeModelOutput(
      {
        detected_type: "bill_of_lading",
        fields: { bl_number: "X", containers: [] },
      },
      PV
    );
    // empty: shipper.name, consignee.name, POL, POD, containers = 5
    assert.equal(countEmptyCriticalFields(out), 5);
  });
});
