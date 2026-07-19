import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeCheckDigit,
  containerCheckDigit,
  iso6346LetterValue,
  normalizeContainerNo,
  validateContainerNo,
} from "./container";

describe("iso6346LetterValue", () => {
  it("maps letters skipping multiples of 11", () => {
    // Published ISO 6346 table anchors.
    assert.equal(iso6346LetterValue("A"), 10);
    assert.equal(iso6346LetterValue("B"), 12);
    assert.equal(iso6346LetterValue("K"), 21);
    assert.equal(iso6346LetterValue("L"), 23);
    assert.equal(iso6346LetterValue("U"), 32);
    assert.equal(iso6346LetterValue("V"), 34);
    assert.equal(iso6346LetterValue("Z"), 38);
  });
});

describe("computeCheckDigit", () => {
  it("computes 3 for the documented CSQU305438 example", () => {
    assert.equal(computeCheckDigit("CSQU305438"), 3);
    assert.equal(computeCheckDigit("CSQU3054383"), 3); // 11 chars also fine
  });

  it("maps remainder 10 to check digit 0 (HLXU100010)", () => {
    // sum = 464 + 16 + 256 = 736; 736 mod 11 = 10 -> 0
    assert.equal(computeCheckDigit("HLXU100010"), 0);
  });

  it("returns null for non-container shapes", () => {
    assert.equal(computeCheckDigit("FOO"), null);
    assert.equal(computeCheckDigit("12345678901"), null);
    assert.equal(computeCheckDigit(""), null);
  });
});

describe("containerCheckDigit", () => {
  it("accepts valid numbers", () => {
    assert.equal(containerCheckDigit("CSQU3054383"), true);
    assert.equal(containerCheckDigit("MSKU6856622"), true); // hand-computed
    assert.equal(containerCheckDigit("HLXU1000100"), true); // 10 -> 0 rule
  });

  it("rejects a wrong check digit", () => {
    assert.equal(containerCheckDigit("CSQU3054384"), false);
    assert.equal(containerCheckDigit("MSKU6856625"), false);
  });

  it("normalizes spaces, hyphens and case", () => {
    assert.equal(containerCheckDigit("csqu 305438-3"), true);
    assert.equal(normalizeContainerNo("csqu 305438-3"), "CSQU3054383");
  });

  it("returns null for shapes that are not container numbers", () => {
    assert.equal(containerCheckDigit("ABC1234567"), null); // 3 letters
    assert.equal(containerCheckDigit("MSKA1234565"), null); // category not U/J/Z
    assert.equal(containerCheckDigit("CSQU305438"), null); // missing check digit
    assert.equal(containerCheckDigit(""), null);
  });
});

describe("validateContainerNo", () => {
  it("pass result for a valid number", () => {
    const r = validateContainerNo("containers[0].container_no", "CSQU3054383");
    assert.equal(r.status, "pass");
    assert.equal(r.rule, "iso6346");
    assert.equal(r.field, "containers[0].container_no");
  });

  it("fail result carries the expected corrected number", () => {
    const r = validateContainerNo("containers[1].container_no", "CSQU3054384");
    assert.equal(r.status, "fail");
    assert.equal(r.expected, "CSQU3054383");
    assert.equal(r.actual, "CSQU3054384");
    assert.match(r.message, /Check digit should be 3/);
  });

  it("warn result for a non-standard shape", () => {
    const r = validateContainerNo("container_refs[0]", "PALLET 12");
    assert.equal(r.status, "warn");
    assert.match(r.message, /not a standard container number/);
  });
});
