import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { containerRows, csvTable, docRef, lineRows, summaryPairs } from "./rows";

const BL_FIELDS = {
  bl_number: "MAEU1",
  shipper: { name: "ACME" },
  containers: [
    { container_no: "CSQU3054383", seal_no: "S1", gross_kg: 18450, tare_kg: null },
    { container_no: "MSKU6856622", gross_kg: 17980 },
  ],
  cargo: [{ description: "CERAMICS", packages: 1200, gross_kg: null }],
  total_gross_kg: 36430,
  _meta: { page_refs: {} },
};

describe("summaryPairs", () => {
  it("keeps ordered labels and excludes container rows", () => {
    const pairs = summaryPairs("bill_of_lading", BL_FIELDS);
    assert.equal(pairs[0].label, "B/L number");
    assert.equal(pairs[0].value, "MAEU1");
    assert.ok(pairs.every((p) => !p.label.startsWith("Container ")));
  });
});

describe("containerRows / lineRows", () => {
  it("emits header + one row per container, numbers kept numeric", () => {
    const rows = containerRows(BL_FIELDS);
    assert.equal(rows.length, 3);
    assert.equal(rows[0][0], "container_no");
    assert.equal(rows[1][0], "CSQU3054383");
    assert.equal(rows[1][5], 18450); // gross_kg numeric
    assert.equal(rows[1][6], ""); // null tare -> empty
  });

  it("lineRows reads cargo (B/L) and line_items alike", () => {
    assert.equal(lineRows(BL_FIELDS)[1][0], "CERAMICS");
    assert.equal(lineRows({ line_items: [{ description: "X" }] })[1][0], "X");
    assert.deepEqual(lineRows({}), []);
  });
});

describe("csvTable", () => {
  it("prefers line items, prefixing doc_type and ref", () => {
    const t = csvTable("bill_of_lading", BL_FIELDS);
    assert.deepEqual(t[0].slice(0, 3), ["doc_type", "ref", "description"]);
    assert.deepEqual(t[1].slice(0, 3), ["bill_of_lading", "MAEU1", "CERAMICS"]);
  });

  it("falls back to containers, then to a summary row", () => {
    const noLines = { bl_number: "B1", containers: BL_FIELDS.containers, _meta: {} };
    assert.equal(csvTable("bill_of_lading", noLines)[1][2], "CSQU3054383");

    const bare = { invoice_no: "INV-1", _meta: {} };
    const t = csvTable("commercial_invoice", bare);
    assert.equal(t.length, 2);
    assert.equal(t[1][0], "commercial_invoice");
    assert.ok(t[0].includes("Invoice number"));
  });
});

describe("docRef", () => {
  it("bl_number > invoice_no > pl_no > null", () => {
    assert.equal(docRef({ bl_number: "B" }), "B");
    assert.equal(docRef({ invoice_no: "I" }), "I");
    assert.equal(docRef({ pl_no: "P" }), "P");
    assert.equal(docRef({}), null);
  });
});
