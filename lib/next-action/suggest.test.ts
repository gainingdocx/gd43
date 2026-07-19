import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { suggest, type NextActionDoc } from "./index";

const doc = (over: Partial<NextActionDoc>): NextActionDoc => ({
  id: "d1",
  doc_type: "bill_of_lading",
  status: "parsed",
  validation_fails: 0,
  shipment_id: null,
  ...over,
});

const none = { docs: [], openDiscrepancies: [], checkedShipmentIds: [] };

describe("suggest — rule priority", () => {
  it("empty workspace → primary is scan-first", () => {
    const a = suggest(none);
    assert.equal(a.length, 1);
    assert.deepEqual([a[0].id, a[0].role], ["scan", "primary"]);
  });

  it("open red discrepancy outranks everything", () => {
    const a = suggest({
      docs: [doc({ validation_fails: 2 })],
      openDiscrepancies: [
        { severity: "amber", shipment_id: "s2" },
        { severity: "red", shipment_id: "s1" },
      ],
      checkedShipmentIds: ["s1", "s2"],
    });
    assert.equal(a[0].id, "resolve-discrepancies");
    assert.equal(a[0].role, "primary");
    assert.equal(a[0].href, "/app/shipments/s1"); // red one wins
    assert.match(a[0].description, /red discrepancy/);
  });

  it("amber-only discrepancy still leads, without the red wording", () => {
    const a = suggest({
      ...none,
      openDiscrepancies: [{ severity: "amber", shipment_id: "s2" }],
    });
    assert.equal(a[0].id, "resolve-discrepancies");
    assert.doesNotMatch(a[0].description, /red/);
  });

  it("validation failures suggest reviewing the flagged doc", () => {
    const a = suggest({ ...none, docs: [doc({ id: "bad", validation_fails: 1 })] });
    assert.deepEqual([a[0].id, a[0].href], ["review-flagged", "/app/review/bad"]);
  });

  it("failed parse suggests retry", () => {
    const a = suggest({ ...none, docs: [doc({ status: "failed" })] });
    assert.equal(a[0].id, "retry-parse");
  });

  it("B/L + counterpart in an unchecked shipment → run Shipment Check", () => {
    const a = suggest({
      docs: [
        doc({ id: "b", shipment_id: "s1" }),
        doc({ id: "c", doc_type: "commercial_invoice", shipment_id: "s1" }),
        doc({ id: "p", doc_type: "packing_list", shipment_id: "s1" }),
      ],
      openDiscrepancies: [],
      checkedShipmentIds: [],
    });
    assert.deepEqual([a[0].id, a[0].href], ["run-shipment-check", "/app/shipments/s1"]);
  });

  it("already-checked shipment does not re-suggest the check", () => {
    const a = suggest({
      docs: [
        doc({ id: "b", shipment_id: "s1" }),
        doc({ id: "c", doc_type: "commercial_invoice", shipment_id: "s1" }),
      ],
      openDiscrepancies: [],
      checkedShipmentIds: ["s1"],
    });
    assert.notEqual(a[0].id, "run-shipment-check");
  });

  it("lone B/L in a shipment (no counterpart) does not suggest the check", () => {
    const a = suggest({
      ...none,
      docs: [doc({ id: "b", shipment_id: "s1" })],
    });
    assert.ok(a.every((x) => x.id !== "run-shipment-check"));
  });

  it("CI without PL → generate packing list; PL without CI → generate invoice", () => {
    const ci = suggest({
      ...none,
      docs: [doc({ id: "c", doc_type: "commercial_invoice" })],
    });
    assert.equal(ci[0].id, "generate-pl");
    assert.match(ci[0].href, /generate=packing_list/);

    const pl = suggest({
      ...none,
      docs: [doc({ id: "p", doc_type: "packing_list" })],
    });
    assert.equal(pl[0].id, "generate-ci");
  });

  it("CI + PL both present suggests neither generation", () => {
    const a = suggest({
      ...none,
      docs: [
        doc({ id: "c", doc_type: "commercial_invoice" }),
        doc({ id: "p", doc_type: "packing_list" }),
      ],
    });
    assert.ok(a.every((x) => x.id !== "generate-pl" && x.id !== "generate-ci"));
  });

  it("ungrouped doc among several suggests adding to a shipment", () => {
    const a = suggest({
      ...none,
      docs: [
        doc({ id: "b", shipment_id: "s1" }),
        doc({ id: "c", doc_type: "commercial_invoice", shipment_id: null }),
      ],
    });
    assert.ok(a.some((x) => x.id === "add-to-shipment"));
  });

  it("caps at 1 primary + 2 secondary", () => {
    const a = suggest({
      docs: [
        doc({ id: "b", shipment_id: "s1", validation_fails: 3 }),
        doc({ id: "c", doc_type: "commercial_invoice", shipment_id: "s1" }),
        doc({ id: "x", status: "failed" }),
      ],
      openDiscrepancies: [{ severity: "red", shipment_id: "s1" }],
      checkedShipmentIds: [],
    });
    assert.equal(a.length, 3);
    assert.deepEqual(a.map((x) => x.role), ["primary", "secondary", "secondary"]);
  });

  it("single healthy B/L → open it is primary, scan-another is secondary", () => {
    const a = suggest({ ...none, docs: [doc({ id: "b" })] });
    assert.deepEqual(
      a.map((x) => [x.id, x.role]),
      [
        ["review-bl", "primary"],
        ["scan", "secondary"],
      ]
    );
  });
});
