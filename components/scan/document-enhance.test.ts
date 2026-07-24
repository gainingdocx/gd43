import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectDocumentCorners, detectGlare } from "./document-enhance";

function image(width: number, height: number, fill: [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = 255;
  }
  return { width, height, data };
}

describe("mobile scan analysis", () => {
  it("warns for a concentrated white glare patch", () => {
    const source = image(240, 320, [215, 215, 215]);
    for (let y = 40; y < 115; y++) {
      for (let x = 60; x < 140; x++) {
        const index = (y * source.width + x) * 4;
        source.data[index] = source.data[index + 1] = source.data[index + 2] = 255;
      }
    }
    const result = detectGlare(source);
    assert.equal(result.glare, true);
    assert.ok(result.percent > 0.05);
  });

  it("finds a high-contrast document boundary", () => {
    const source = image(300, 400, [40, 40, 40]);
    for (let y = 45; y < 365; y++) {
      for (let x = 35; x < 265; x++) {
        const index = (y * source.width + x) * 4;
        source.data[index] = source.data[index + 1] = source.data[index + 2] = 235;
      }
    }
    const result = detectDocumentCorners(source);
    assert.ok(result.corners);
    assert.ok(result.confidence >= 0.58);
  });
});
