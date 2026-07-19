import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { coerceEdit, flattenFields, getPath, setPath } from "./display";

describe("getPath / setPath", () => {
  const fields = {
    bl_number: "X1",
    shipper: { name: "ACME", address: null },
    containers: [{ container_no: "CSQU3054383", gross_kg: 100 }],
  };

  it("gets nested and indexed paths", () => {
    assert.equal(getPath(fields, "bl_number"), "X1");
    assert.equal(getPath(fields, "shipper.name"), "ACME");
    assert.equal(getPath(fields, "containers[0].gross_kg"), 100);
    assert.equal(getPath(fields, "consignee.name"), undefined);
  });

  it("sets immutably without touching siblings", () => {
    const next = setPath(fields, "containers[0].gross_kg", 200);
    assert.equal(getPath(next, "containers[0].gross_kg"), 200);
    assert.equal(getPath(fields, "containers[0].gross_kg"), 100); // original intact
    assert.equal(getPath(next, "containers[0].container_no"), "CSQU3054383");
    assert.equal(getPath(next, "shipper.name"), "ACME");
  });

  it("creates intermediate objects for null parties", () => {
    const next = setPath({ consignee: null }, "consignee.name", "NEW");
    assert.equal(getPath(next, "consignee.name"), "NEW");
  });
});

describe("flattenFields", () => {
  it("orders B/L rows and appends container rows with page refs", () => {
    const rows = flattenFields("bill_of_lading", {
      bl_number: "MAEU1",
      shipper: { name: "ACME" },
      containers: [{ container_no: "CSQU3054383", seal_no: "S1", gross_kg: 10 }],
      _meta: { page_refs: { bl_number: 1, containers: 2 } },
    });
    assert.equal(rows[0].path, "bl_number");
    assert.equal(rows[0].value, "MAEU1");
    assert.equal(rows[0].page, 1);
    const cont = rows.find((r) => r.path === "containers[0].container_no");
    assert.equal(cont?.value, "CSQU3054383");
    assert.equal(cont?.page, 2);
  });

  it("'other' docs show scalar raw keys read-only", () => {
    const rows = flattenFields("other", {
      raw: { doc_title: "Sea Waybill", nested: { x: 1 }, count: 3 },
    });
    assert.deepEqual(
      rows.map((r) => [r.path, r.value, r.editable]),
      [
        ["raw.doc_title", "Sea Waybill", false],
        ["raw.count", "3", false],
      ]
    );
  });
});

describe("coerceEdit", () => {
  it("numbers stay numbers, empties become null, text stays text", () => {
    assert.equal(coerceEdit(100, "36,430.00"), 36430);
    assert.equal(coerceEdit(null, "42"), 42);
    assert.equal(coerceEdit("abc", "  "), null);
    assert.equal(coerceEdit("abc", "HELSINKI"), "HELSINKI");
    assert.equal(coerceEdit(null, "MAEU 123"), "MAEU 123");
  });
});
