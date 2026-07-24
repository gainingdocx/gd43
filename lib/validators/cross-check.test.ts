import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { crossCheck } from "./cross-check";
import { duplicates } from "./duplicates";
import { validateDocument } from "./index";
import { container, makeBL, makeCI, makeLine, makePL, party } from "./testing";

describe("duplicates", () => {
  it("warns on a normalized match", () => {
    const r = duplicates("bl_number", "MAEU 123456789", [
      { id: "a", value: "maeu123456789" },
      { id: "b", value: "OTHER" },
    ]);
    assert.equal(r?.status, "warn");
    assert.match(r!.message, /1 document with B\/L number/);
  });

  it("pluralizes for several hits and names invoices", () => {
    const r = duplicates("invoice_no", "INV-1", [
      { id: "a", value: "INV 1" },
      { id: "b", value: "inv-1" },
    ]);
    assert.match(r!.message, /2 documents with invoice number/);
  });

  it("null for no match, null value, or empty value", () => {
    assert.equal(duplicates("bl_number", "X1", [{ id: "a", value: "X2" }]), null);
    assert.equal(duplicates("bl_number", null, [{ id: "a", value: "X" }]), null);
    assert.equal(duplicates("bl_number", "  ", []), null);
    assert.equal(
      duplicates("bl_number", "X1", [{ id: "a", value: null }]),
      null
    );
  });
});

describe("crossCheck — parties", () => {
  it("is silent when names match after normalization", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ shipper: party("ACME Co., Ltd."), consignee: { ...party("Buyer Inc"), to_order: null } }) },
      { id: "ci1", extraction: makeCI({ seller: party("acme co ltd"), buyer: party("BUYER, INC.") }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });

  it("flags differing parties red across all three pairings", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ shipper: party("ACME Ltd") }) },
      { id: "ci1", extraction: makeCI({ seller: party("ACME Trading Ltd") }) },
      { id: "pl1", extraction: makePL({ seller: party("Completely Different Co") }) },
    ];
    const r = crossCheck(docs);
    assert.equal(r.length, 3); // bl-ci, bl-pl, ci-pl
    assert.ok(r.every((d) => d.severity === "red" && d.field === "shipper/seller" || d.field === "seller"));
  });

  it("proves nothing when one side is missing", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ shipper: null }) },
      { id: "ci1", extraction: makeCI({ seller: party("ACME") }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });
});

describe("crossCheck — containers", () => {
  it("red when B/L and packing list container sets differ", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ containers: [container("CSQU3054383"), container("MSKU6856622")] }) },
      { id: "pl1", extraction: makePL({ container_refs: ["CSQU3054383"] }) },
    ];
    const r = crossCheck(docs);
    assert.equal(r.length, 1);
    assert.equal(r[0].severity, "red");
    assert.equal(r[0].field, "containers");
  });

  it("matches container tokens embedded in free text", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ containers: [container("CSQU3054383")] }) },
      { id: "pl1", extraction: makePL({ container_refs: ["Ctr CSQU 305438-3 / Seal 991"] }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });

  it("ignores null container numbers on the B/L", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ containers: [container("CSQU3054383"), { ...container("X"), container_no: null }] }) },
      { id: "pl1", extraction: makePL({ container_refs: ["CSQU3054383"] }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });

  it("silent when either side has no containers", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ containers: [container("CSQU3054383")] }) },
      { id: "pl1", extraction: makePL({ container_refs: [] }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });
});

describe("crossCheck — ports, incoterm, weights, packages, dates", () => {
  it("red when matching-critical PO or LC references differ", () => {
    const r = crossCheck([
      { id: "bl1", extraction: makeBL({ purchase_order_refs: ["PO-100"], lc_number: "LC 777" }) },
      { id: "ci1", extraction: makeCI({ po_no: "PO-200", lc_number: "LC 888" }) },
    ]);
    assert.deepEqual(r.map((x) => [x.severity, x.field]), [
      ["red", "po_number"], ["red", "lc_number"],
    ]);
  });

  it("matches commercial references after punctuation normalization", () => {
    const r = crossCheck([
      { id: "bl1", extraction: makeBL({ purchase_order_refs: ["PO 100"], lc_number: "LC-777" }) },
      { id: "ci1", extraction: makeCI({ po_no: "po-100", lc_number: "lc 777" }) },
    ]);
    assert.deepEqual(r, []);
  });

  it("red on differing port pairs across two B/Ls", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ port_of_load: { name: "Shanghai", unlocode: "CNSGH" }, port_of_discharge: { name: "Rotterdam", unlocode: "NLRTM" } }) },
      { id: "bl2", extraction: makeBL({ port_of_load: { name: "Shanghai", unlocode: "CNSGH" }, port_of_discharge: { name: "Hamburg", unlocode: "DEHAM" } }) },
    ];
    const r = crossCheck(docs);
    assert.equal(r.length, 1);
    assert.deepEqual([r[0].severity, r[0].field], ["red", "port_of_discharge"]);
  });

  it("matches ports by name when codes are missing", () => {
    const docs = [
      { id: "bl1", extraction: makeBL({ port_of_load: { name: "Port Klang", unlocode: null } }) },
      { id: "bl2", extraction: makeBL({ port_of_load: { name: "PORT KLANG", unlocode: null } }) },
    ];
    assert.deepEqual(crossCheck(docs), []);
  });

  it("amber when incoterm codes differ; silent when only wording differs", () => {
    const same = crossCheck([
      { id: "bl1", extraction: makeBL({ incoterm: "FOB Shanghai" }) },
      { id: "ci1", extraction: makeCI({ incoterm: "FOB" }) },
    ]);
    assert.deepEqual(same, []);

    const diff = crossCheck([
      { id: "bl1", extraction: makeBL({ incoterm: "FOB" }) },
      { id: "ci1", extraction: makeCI({ incoterm: "CIF Rotterdam" }) },
    ]);
    assert.deepEqual([diff[0].severity, diff[0].field], ["amber", "incoterm"]);
  });

  it("amber when B/L and PL gross totals disagree", () => {
    const r = crossCheck([
      { id: "bl1", extraction: makeBL({ total_gross_kg: 36430 }) },
      { id: "pl1", extraction: makePL({ total_gross_kg: 35000 }) },
    ]);
    assert.deepEqual([r[0].severity, r[0].field], ["amber", "total_gross_kg"]);
  });

  it("checks B/L net weight and volume against the packing list", () => {
    const r = crossCheck([
      { id: "bl1", extraction: makeBL({ total_net_kg: 15000, total_volume_cbm: 20 }) },
      { id: "pl1", extraction: makePL({ total_net_kg: 14000, total_volume_cbm: 18 }) },
    ]);
    assert.deepEqual(r.map((x) => x.field), ["total_net_kg", "total_volume_cbm"]);
  });

  it("amber when CI line-weight sum disagrees with PL total", () => {
    const r = crossCheck([
      { id: "ci1", extraction: makeCI({ line_items: [makeLine({ gross_kg: 100 }), makeLine({ gross_kg: 200 })] }) },
      { id: "pl1", extraction: makePL({ total_gross_kg: 400 }) },
    ]);
    assert.equal(r.length, 1);
    assert.equal(r[0].value_a, "300");
  });

  it("amber on package-count mismatch", () => {
    const r = crossCheck([
      { id: "bl1", extraction: makeBL({ total_packages: 100 }) },
      { id: "pl1", extraction: makePL({ total_cartons: 90 }) },
    ]);
    assert.deepEqual([r[0].severity, r[0].field], ["amber", "total_packages"]);
  });

  it("amber when the invoice is dated long after the B/L", () => {
    const r = crossCheck([
      { id: "ci1", extraction: makeCI({ invoice_date: "01 MAY 2026" }) },
      { id: "bl1", extraction: makeBL({ shipped_on_board_date: "01 MAR 2026" }) },
    ]);
    assert.deepEqual([r[0].severity, r[0].field], ["amber", "invoice_date"]);
  });

  it("invoice within tolerance of the B/L date is fine", () => {
    const r = crossCheck([
      { id: "ci1", extraction: makeCI({ invoice_date: "05 MAR 2026" }) },
      { id: "bl1", extraction: makeBL({ issue_date: "01 MAR 2026" }) },
    ]);
    assert.deepEqual(r, []);
  });

  it("empty shipment produces nothing", () => {
    assert.deepEqual(crossCheck([]), []);
  });
});

describe("validateDocument", () => {
  it("runs container, imo, port, weight and date rules for a B/L", () => {
    const r = validateDocument(
      makeBL({
        containers: [container("CSQU3054383", 18000), container("BAD", 18000)],
        imo_number: "IMO 9074729",
        port_of_load: { name: "Shanghai", unlocode: null },
        port_of_discharge: { name: "Rotterdam", unlocode: "NLRTM" },
        total_gross_kg: 36000,
        shipped_on_board_date: "01 MAR 2026",
        issue_date: "02 MAR 2026",
      }),
      new Date(Date.UTC(2026, 6, 19))
    );
    const rules = r.map((x) => x.rule);
    assert.ok(rules.filter((x) => x === "iso6346").length === 2);
    assert.ok(rules.includes("imo_checksum"));
    assert.ok(rules.includes("unlocode"));
    assert.ok(rules.includes("weights.container_sum"));
    assert.ok(rules.includes("dates.sob_vs_issue"));
    assert.ok(r.every((x) => ["pass", "warn"].includes(x.status)));
  });

  it("validates packing-list container refs", () => {
    const r = validateDocument(
      makePL({ container_refs: ["CSQU3054383", "CSQU3054384"] }),
      new Date(Date.UTC(2026, 6, 19))
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [
        ["iso6346", "pass"],
        ["iso6346", "fail"],
      ]
    );
  });

  it("runs weight and date rules for a commercial invoice", () => {
    const r = validateDocument(
      makeCI({
        invoice_date: "01 AUG 2026",
        line_items: [makeLine({ gross_kg: 90, net_kg: 100 })],
      }),
      new Date(Date.UTC(2026, 6, 19))
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [
        ["weights.gross_ge_net", "fail"],
        ["dates.invoice_future", "warn"],
      ]
    );
  });

  it("'other' documents validate to an empty list", () => {
    const other = {
      detected_type: "other" as const,
      fields: {
        raw: {},
        _meta: {
          detected_type: "other" as const,
          confidence_flags: [],
          page_refs: {},
          prompt_version: "test",
          source_languages: ["en"],
        },
      },
    };
    assert.deepEqual(validateDocument(other, new Date()), []);
  });
});
