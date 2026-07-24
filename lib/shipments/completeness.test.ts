import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessCompleteness } from "./completeness";

describe("shipment completeness", () => {
  it("distinguishes present, processing, missing, and conditional documents", () => {
    const result = assessCompleteness([
      { doc_type: "bill_of_lading", status: "parsed" },
      { doc_type: "commercial_invoice", status: "parsing" },
    ]);
    assert.equal(result.percent, 33);
    assert.deepEqual(result.results.map((item) => item.state), ["present", "processing", "missing", "optional"]);
  });
  it("recognizes a certificate uploaded as other only from its filename", () => {
    const result = assessCompleteness([
      { doc_type: "other", status: "parsed", source_filename: "Certificate_of_Origin.pdf" },
    ], [{ requirement_key: "origin", label: "Certificate of origin", accepted_types: ["other"], filename_hint: "certificate origin", required: true }]);
    assert.equal(result.results.find((item) => item.requirement_key === "origin")?.state, "present");
  });
  it("supports custom required document rules", () => {
    const result = assessCompleteness([], [{
      requirement_key: "fumigation", label: "Fumigation certificate", accepted_types: ["other"], filename_hint: "fumigation", required: true,
    }]);
    assert.equal(result.results.find((item) => item.requirement_key === "fumigation")?.state, "missing");
  });
});
