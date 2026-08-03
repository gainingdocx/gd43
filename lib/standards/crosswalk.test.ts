import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STANDARD_SOURCES, STANDARDS_CROSSWALK_VERSION, TRANSPORT_DOCUMENT_CROSSWALK, standardsProfile, validateCanonicalDocument } from "./crosswalk";

describe("versioned standards crosswalk", () => {
  it("pins every mapping source and keeps canonical fields unique", () => {
    assert.match(STANDARDS_CROSSWALK_VERSION, /^\d{4}\.\d{2}$/);
    assert.equal(STANDARD_SOURCES.dcsa.version, "3.0.3");
    assert.equal(new Set(TRANSPORT_DOCUMENT_CROSSWALK.map((item) => item.canonicalField)).size, TRANSPORT_DOCUMENT_CROSSWALK.length);
    assert.ok(TRANSPORT_DOCUMENT_CROSSWALK.every((item) => item.uncefact && item.meaning));
  });

  it("reports semantic coverage without claiming external conformance", () => {
    const profile = standardsProfile("bill_of_lading", { bl_number: "BL-1", port_of_load: { unlocode: "CNSHA" } });
    assert.equal(profile.coverage.populatedMappedFields, 2);
    assert.match(profile.status, /not DCSA, UN\/CEFACT or FIATA certification/);
  });

  it("checks internal canonical transport-document fixtures", () => {
    assert.equal(validateCanonicalDocument("bill_of_lading", { bl_number: "BL-1", _meta: { source_evidence: {} } }).conforms, true);
    const invalid = validateCanonicalDocument("bill_of_lading", { _meta: {} });
    assert.equal(invalid.conforms, false);
    assert.ok(invalid.errors.some((item) => item.includes("bl_number")));
  });
});
