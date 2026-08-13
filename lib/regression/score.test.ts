import assert from "node:assert/strict";
import test from "node:test";

import { aggregateCategoryScores, expectationMatches, scoreCorpusCase } from "./score";

test("normalizes Unicode, case and whitespace without weakening exact field comparison", () => {
  assert.equal(expectationMatches("  Café   Exporters ", "CAFÉ EXPORTERS"), true);
  assert.equal(expectationMatches("BL-100", "BL-101"), false);
  assert.equal(expectationMatches(1250.0001, 1250), true);
});

test("scores each shipping field category independently", () => {
  const score = scoreCorpusCase({
    id: "ci-001",
    doc_type: "commercial_invoice",
    workflows: ["shipment_document_check"],
    labels: {
      identifiers: [{ path: "fields.invoice_no", value: "INV-001" }],
      parties: [{ path: "fields.seller.name", value: "ACME EXPORTS" }],
      monetary_values: [{ path: "fields.total_amount", value: 1250 }],
    },
  }, {
    fields: { invoice_no: "inv-001", seller: { name: "Acme Exports" }, total_amount: 1200 },
  });

  assert.deepEqual(score.identifiers, { passed: 1, total: 1, accuracy: 100 });
  assert.deepEqual(score.parties, { passed: 1, total: 1, accuracy: 100 });
  assert.deepEqual(score.monetary_values, { passed: 0, total: 1, accuracy: 0 });
});

test("aggregates category counts instead of averaging percentages", () => {
  const first = scoreCorpusCase({
    id: "a", doc_type: "other", workflows: [],
    labels: { identifiers: [{ path: "x", value: "A" }, { path: "y", value: "B" }] },
  }, { x: "A", y: "B" });
  const second = scoreCorpusCase({
    id: "b", doc_type: "other", workflows: [],
    labels: { identifiers: [{ path: "x", value: "C" }] },
  }, { x: "wrong" });
  assert.deepEqual(aggregateCategoryScores([first, second]).identifiers, {
    passed: 2, total: 3, accuracy: 66.67,
  });
});
