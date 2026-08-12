import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pdfFontRuns, shapePdfText } from "./pdf-text";

describe("PDF text shaping", () => {
  it("leaves Latin and CJK text unchanged", () => {
    assert.equal(shapePdfText("B/L 上海港"), "B/L 上海港");
  });

  it("uses joined Arabic presentation forms and visual bidi order", () => {
    const shaped = shapePdfText("مستندات الشحن");
    assert.notEqual(shaped, "مستندات الشحن");
    assert.match(shaped, /[\ufb50-\ufdff\ufe70-\ufeff]/);
  });

  it("splits Devanagari from punctuation so each run uses a font that contains it", () => {
    assert.deepEqual(pdfFontRuns("मुंबई - Shanghai"), [
      { text: "मुंबई", script: "devanagari" },
      { text: " - Shanghai", script: "default" },
    ]);
  });
});
