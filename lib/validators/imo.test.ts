import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { imoChecksum, normalizeImo, validateImo } from "./imo";

describe("imoChecksum", () => {
  it("accepts documented valid numbers", () => {
    assert.equal(imoChecksum("9074729"), true); // canonical example
    assert.equal(imoChecksum("9319466"), true); // Emma Maersk
  });

  it("accepts the IMO prefix and separators", () => {
    assert.equal(imoChecksum("IMO 9074729"), true);
    assert.equal(imoChecksum("imo: 9319466"), true);
    assert.equal(normalizeImo("IMO 9074729"), "9074729");
  });

  it("rejects a wrong last digit", () => {
    assert.equal(imoChecksum("9074728"), false);
    assert.equal(imoChecksum("9319467"), false);
  });

  it("returns null for non-IMO shapes", () => {
    assert.equal(imoChecksum("123"), null);
    assert.equal(imoChecksum("abcdefg"), null);
    assert.equal(imoChecksum("90747290"), null); // 8 digits
    assert.equal(imoChecksum(""), null);
  });
});

describe("validateImo", () => {
  it("pass / fail / warn statuses", () => {
    assert.equal(validateImo("imo_number", "IMO 9074729").status, "pass");
    const fail = validateImo("imo_number", "9074728");
    assert.equal(fail.status, "fail");
    assert.match(fail.message, /checksum/);
    assert.equal(validateImo("imo_number", "V.2011").status, "warn");
  });
});
