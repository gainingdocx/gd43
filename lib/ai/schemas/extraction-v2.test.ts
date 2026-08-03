import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  containersOf,
  countEmptyCriticalFields,
  extractionQualityScore,
  needsQualityEscalation,
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
      booking_no: "BK-2002-15",
      export_references: ["S.B.NO.00305/15-2-2002"],
      customs_reference: "CUS.NO.5102000728",
      purchase_order_refs: ["PO-77"],
      lc_number: "079736192",
      shipper: {
        name: "ACME EXPORTS PVT. LTD.",
        address: "12 HARBOUR ROAD",
        city: null,
        postal_code: "682006",
        country: "INDIA",
        tax_id: null,
      },
      consignee: { name: "NORDIC TRADING OY", address: "SATAMAKATU 1", to_order: true },
      notify: { name: "NORDIC LOGISTICS" },
      vessel_name: "MSC ANTWERP",
      voyage_no: "426W",
      port_of_load: "NHAVA SHEVA (JNPT)", // bare string form
      port_of_discharge: { name: "HELSINKI", unlocode: "FIHEL" },
      place_of_receipt: "MUMBAI",
      place_of_delivery: "HELSINKI",
      shipped_on_board_date: "19 JUL 2026",
      issue_date: "20 JUL 2026",
      freight_terms: "PREPAID", // wrong casing
      bl_type: "Original",
      originals_count: "3", // string number
      total_gross_kg: "36,430.00", // formatted string number
      total_net_kg: "35,000 NET KGS",
      containers: [
        { container_no: "TCLU4837291", seal_no: "SL-77", iso_type: "40HC", gross_kg: "18,450.00", packages: 620 },
        { container_no: "MSCU6639870 / SL908771", packages: 120 },
        { container_no: null }, // all-null row must be dropped
      ],
      line_items: [{ description: "CERAMIC TABLEWARE", packages: 1200, package_type: "CARTONS", net_kg: 35000, gross_kg: 36430, volume_cbm: 54.2 }],
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
    assert.equal(out.fields.shipper?.postal_code, "682006");
    assert.deepEqual(out.fields.export_references, ["S.B.NO.00305/15-2-2002"]);
    assert.equal(out.fields.lc_number, "079736192");
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
    assert.equal(out.fields.total_net_kg, 35000);
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

  it("preserves only valid exact source evidence", () => {
    const out = normalizeModelOutput({
      detected_type: "other", fields: {},
      source_evidence: {
        bl_number: { page: 2, quote: "  B/L No. ABC 123  ", bbox: [8.5, 4, 20, 3.5] },
        invalid_page: { page: 0, quote: "bad" },
        empty: { page: 1, quote: "" },
      },
    }, "test");
    assert.deepEqual(out.fields._meta.source_evidence, { bl_number: { page: 2, quote: "B/L No. ABC 123", bbox: [8.5, 4, 20, 3.5] } });
  });

  it("counts zero empty critical fields (all present here)", () => {
    assert.equal(countEmptyCriticalFields(out), 0);
  });

  it("scores a detailed result above the escalation threshold", () => {
    assert.ok(extractionQualityScore(out) >= 82);
    assert.equal(needsQualityEscalation(out), false);
  });

  it("escalates a shallow parse even when its JSON is valid", () => {
    const shallow = normalizeModelOutput({
      detected_type: "bill_of_lading",
      fields: {
        bl_number: "COKA0793", carrier_name: "MAERSK SEALAND",
        shipper: { name: "UPSANA EXPORTS" },
        consignee: { name: "TO THE ORDER OF YAPI VE KREDI BANK" },
        notify: { name: "OSMAN AKBIYIK" }, vessel_name: "RSK ATLANTIC",
        line_items: [{ description: "FROZEN SQUID" }], bl_type: "original",
      },
    }, PV);
    assert.ok(extractionQualityScore(shallow) < 82);
    assert.equal(needsQualityEscalation(shallow), true);
  });

    it("repairs a route inversion only when origin and destination party cities both agree", () => {
    const routed = normalizeModelOutput({
      detected_type: "bill_of_lading",
      fields: {
        shipper: { name: "EXPORTER", city: "COCHIN" },
        notify: { name: "IMPORTER", city: "IZMIR" },
        consignee: { name: "TO THE ORDER OF BANK" },
        port_of_load: { name: "IZMIR" },
        port_of_discharge: { name: "COCHIN, INDIA" },
        cargo_raw_text: "LC NO.079736192",
      },
    }, PV);
    if (routed.detected_type !== "bill_of_lading") return;
    assert.equal(routed.fields.port_of_load?.name, "COCHIN, INDIA");
    assert.equal(routed.fields.port_of_discharge?.name, "IZMIR");
    assert.equal(routed.fields.consignee?.to_order, true);
    assert.equal(routed.fields.lc_number, "079736192");
  });
});

describe("normalizeModelOutput — flagship workflow documents", () => {
  it("normalizes shipping instructions without losing operational fields", () => {
    const out = normalizeModelOutput({ detected_type: "shipping_instructions", fields: {
      si_number: "SI-42", booking_no: "BK-42", shipper: { name: "Exporter Ltd" },
      port_of_load: { name: "Shanghai", unlocode: "CNSHA" },
      containers: [{ container_no: "MSCU6639871", gross_kg: "12000 KG" }],
      requested_bl_type: "telex", total_gross_kg: "12000 KG",
    } }, PV);
    assert.equal(out.detected_type, "shipping_instructions");
    if (out.detected_type !== "shipping_instructions") return;
    assert.equal(out.fields.booking_no, "BK-42");
    assert.equal(out.fields.containers[0].gross_kg, 12000);
    assert.equal(out.fields.requested_bl_type, "telex");
  });

  it("normalizes rates, events and D&D invoices as dedicated records", () => {
    const rate = normalizeModelOutput({ detected_type: "rate_confirmation", fields: {
      rate_agreement_no: "RA-9", currency: "USD", charges: [{ charge_code: "OCEAN", amount: 1500 }],
    } }, PV);
    assert.equal(rate.detected_type, "rate_confirmation");
    if (rate.detected_type === "rate_confirmation") assert.equal(rate.fields.charges[0].amount, 1500);
    const event = normalizeModelOutput({ detected_type: "container_event", fields: {
      container_no: "MSCU6639871", event_type: "empty_return", event_timestamp: "2026-08-02T14:30:00", timezone: "+08:00",
    } }, PV);
    assert.equal(event.detected_type, "container_event");
    const invoice = normalizeModelOutput({ detected_type: "demurrage_detention_invoice", fields: {
      invoice_no: "DD-1", bl_numbers: ["BL-1"], container_refs: ["MSCU6639871"], total_amount: 500,
    } }, PV);
    assert.equal(invoice.detected_type, "demurrage_detention_invoice");
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

describe("normalizeModelOutput — air freight document set", () => {
  it("normalizes AWB hierarchy, route and chargeable-weight evidence", () => {
    const out = normalizeModelOutput({ detected_type: "air_waybill", fields: {
      awb_number: "123-12345675", awb_type: "master", origin_airport: "del", destination_airport: "fra",
      total_pieces: "5", total_gross_kg: "100", total_chargeable_kg: "120",
    } }, "test");
    assert.equal(out.detected_type, "air_waybill");
    if (out.detected_type !== "air_waybill") return;
    assert.equal(out.fields.awb_number, "123-12345675");
    assert.equal(out.fields.origin_airport, "del");
    assert.equal(out.fields.total_chargeable_kg, 120);
  });

  it("normalizes SLI, DGD, manifest and security declarations as dedicated records", () => {
    const types = [
      ["shipper_letter_of_instruction", { instruction_no: "SLI-1", awb_numbers: ["123-12345675"], origin_airport: "DEL" }],
      ["dangerous_goods_declaration", { declaration_reference: "DGD-1", awb_numbers: ["123-12345675"], signatory_name: "A. Shipper" }],
      ["air_cargo_manifest", { manifest_no: "M-1", awb_numbers: ["123-12345675"], total_shipments: "2" }],
      ["cargo_security_declaration", { declaration_reference: "CSD-1", awb_numbers: ["123-12345675"], security_status: "SPX" }],
    ] as const;
    for (const [detected_type, fields] of types) {
      const out = normalizeModelOutput({ detected_type, fields }, "test");
      assert.equal(out.detected_type, detected_type);
      assert.deepEqual((out.fields as unknown as { awb_numbers: string[] }).awb_numbers, ["123-12345675"]);
    }
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

describe("normalizeModelOutput — cargo reconciliation", () => {
  it("uses the verbatim cargo block to repair child counts without double-counting the parent", () => {
    const out = normalizeModelOutput({ detected_type: "bill_of_lading", fields: {
      total_packages: 750,
      cargo_raw_text: "750 CARTONS / 200 CARTONS FROZEN SQUID / 550 CARTONS FROZEN SQUID",
      line_items: [
        { description: "FROZEN SQUID", packages: 750 },
        { description: "FROZEN SQUID WHOLE", packages: 250, cartons: 250 },
        { description: "FROZEN SQUID CLEANED", packages: 500, cartons: 500 },
      ],
    } }, PV);
    assert.equal(out.detected_type, "bill_of_lading");
    if (out.detected_type !== "bill_of_lading") return;
    assert.deepEqual(out.fields.cargo.map((line) => line.packages), [200, 550]);
    assert.deepEqual(out.fields.cargo.map((line) => line.cartons), [200, 550]);
  });

  it("repairs the supplied Maersk aggregate total when noisy raw OCR says 850 instead of 750", () => {
    const out = normalizeModelOutput({ detected_type: "bill_of_lading", fields: {
      total_packages: 850,
      total_net_kg: 15000,
      total_gross_kg: 15750,
      total_volume_cbm: 20,
      cargo_raw_text: "200 CARTONS / 650 CARTONS / TOTAL 850 CARTONS",
      line_items: [{
        description: "750 CARTONS / 200 CARTONS FROZEN SQUID / 550 CARTONS FROZEN SQUID",
        packages: 750,
        cartons: 750,
        net_kg: 15000,
        gross_kg: 15750,
        volume_cbm: 20,
      }],
    } }, PV);
    assert.equal(out.detected_type, "bill_of_lading");
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.total_packages, 750);
    assert.ok(out.fields._meta.confidence_flags.includes("total_packages:reconciled_to_cargo"));
  });

  it("does not double-count a parent declaration when the model already summed parent and children", () => {
    const out = normalizeModelOutput({ detected_type: "bill_of_lading", fields: {
      total_packages: 1500,
      total_gross_kg: 15750,
      cargo_raw_text: "750 CARTONS / 250 CARTONS FROZEN SQUID / 500 CARTONS FROZEN SQUID",
      line_items: [
        { description: "FROZEN SQUID", packages: 750, cartons: 750, gross_kg: 15000, volume_cbm: 20 },
        { description: "FROZEN SQUID WHOLE", packages: 250, cartons: 250 },
        { description: "FROZEN SQUID CLEANED", packages: 500, cartons: 500 },
      ],
    } }, PV);
    assert.equal(out.detected_type, "bill_of_lading");
    if (out.detected_type !== "bill_of_lading") return;
    assert.equal(out.fields.total_packages, 750);
    assert.deepEqual(out.fields.cargo.map((line) => line.packages), [250, 500]);
    assert.ok(out.fields._meta.confidence_flags.includes("total_packages:removed_parent_double_count"));
  });
});

describe("normalizeModelOutput — edge cases", () => {
  it("unknown detected_type becomes 'other' with raw preserved", () => {
    const out = normalizeModelOutput(
      { detected_type: "unsupported_manifest", fields: { foo: "bar" } },
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

describe("normalizeModelOutput — enterprise matching documents", () => {
  it("normalizes a purchase order with matching-grade product fields", () => {
    const out = normalizeModelOutput({ detected_type: "purchase_order", fields: {
      po_number: "PO-001", po_date: "20 JUL 2026", currency: "USD", total_amount: "1,250.00",
      buyer: { name: "Buyer Ltd" }, seller: { name: "Supplier Ltd" },
      line_items: [{ line_no: "10", buyer_product_code: "SKU-7", description: "Frozen squid", quantity: "50 KG", uom: "KG", unit_price: 25, amount: 1250 }],
    } }, PV);
    assert.equal(out.detected_type, "purchase_order");
    if (out.detected_type !== "purchase_order") return;
    assert.equal(out.fields.po_number, "PO-001");
    assert.equal(out.fields.line_items[0].buyer_product_code, "SKU-7");
    assert.equal(out.fields.line_items[0].quantity, 50);
    assert.equal(out.fields.total_amount, 1250);
  });

  it("keeps freight accessorial charges separate", () => {
    const out = normalizeModelOutput({ detected_type: "freight_invoice", fields: {
      invoice_no: "F-9", purchase_order_refs: ["PO-001"], bl_numbers: ["BL-77"],
      carrier: { name: "Ocean Carrier" }, currency: "USD", subtotal: 120,
      charges: [
        { line_no: "1", charge_code: "OFR", description: "Ocean freight", amount: 100, currency: "USD", prepaid_collect: "PREPAID" },
        { line_no: "2", charge_code: "THC", description: "Terminal handling", amount: 20, currency: "USD" },
      ],
    } }, PV);
    assert.equal(out.detected_type, "freight_invoice");
    if (out.detected_type !== "freight_invoice") return;
    assert.equal(out.fields.charges.length, 2);
    assert.equal(out.fields.charges[0].prepaid_collect, "prepaid");
  });

  it("normalizes goods-receipt accepted and rejected totals", () => {
    const out = normalizeModelOutput({ detected_type: "goods_receipt", fields: {
      receipt_no: "GRN-1", purchase_order_refs: ["PO-001"],
      total_received_quantity: 50, total_accepted_quantity: 48, total_rejected_quantity: 2,
    } }, PV);
    assert.equal(out.detected_type, "goods_receipt");
    if (out.detected_type !== "goods_receipt") return;
    assert.deepEqual(out.fields.purchase_order_refs, ["PO-001"]);
    assert.equal(out.fields.total_rejected_quantity, 2);
  });
});
