import assert from "node:assert/strict";
import test from "node:test";
import { awbCheckDigit, normalizeAwbNumber, validateAwbNumber } from "./air-waybill";

test("normalizes a printed AWB number", () => assert.equal(normalizeAwbNumber("123-1234567 5"), "12312345675"));
test("calculates the modulus-7 check digit from the seven-digit serial", () => assert.equal(awbCheckDigit("123-12345675"), 5));
test("passes and fails deterministic AWB checks", () => {
  assert.equal(validateAwbNumber("awb_number", "123-12345675").status, "pass");
  assert.equal(validateAwbNumber("awb_number", "123-12345674").status, "fail");
});
