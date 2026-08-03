import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePageGroups } from "./page-groups";

describe("logical page grouping", () => {
  it("splits a mixed PDF and keeps continuations together", () => {
    const groups = normalizePageGroups({ pages: [
      { page: 1, detected_type: "bill_of_lading", document_key: "BL-1", starts_new_document: true },
      { page: 2, detected_type: "bill_of_lading", document_key: "BL-1", starts_new_document: false },
      { page: 3, detected_type: "commercial_invoice", document_key: "INV-9", starts_new_document: true },
      { page: 4, detected_type: "packing_list", document_key: "PL-9", starts_new_document: true },
    ] }, 4);
    assert.deepEqual(groups.map((group) => group.pages), [[1, 2], [3], [4]]);
    assert.deepEqual(groups.map((group) => group.detectedType), ["bill_of_lading", "commercial_invoice", "packing_list"]);
  });

  it("fails safe to one document when pages are missing", () => {
    assert.deepEqual(normalizePageGroups({ pages: [{ page: 2 }] }, 2)[0].pages, [1, 2]);
  });
});
