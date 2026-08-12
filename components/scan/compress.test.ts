import assert from "node:assert/strict";
import test from "node:test";

import {
  INLINE_IMAGE_TARGET_BYTES,
  MAX_LONG_EDGE,
  shouldOptimizeInlineBlob,
  shouldPreserveRaster,
} from "./compress";

test("preserves supported source rasters within the OCR size ceiling", () => {
  assert.equal(shouldPreserveRaster("image/png", 384, 512), true);
  assert.equal(shouldPreserveRaster("image/jpeg", MAX_LONG_EDGE, 1000), true);
  assert.equal(shouldPreserveRaster("image/webp", 1200, 1800), true);
});

test("converts unsupported or oversized raster inputs", () => {
  assert.equal(shouldPreserveRaster("image/bmp", 384, 512), false);
  assert.equal(shouldPreserveRaster("image/heic", 384, 512), false);
  assert.equal(shouldPreserveRaster("image/png", MAX_LONG_EDGE + 1, 1000), false);
});

test("only optimizes inline images that exceed the quality-first transfer budget", () => {
  assert.equal(shouldOptimizeInlineBlob(224_388), false);
  assert.equal(shouldOptimizeInlineBlob(INLINE_IMAGE_TARGET_BYTES), false);
  assert.equal(shouldOptimizeInlineBlob(INLINE_IMAGE_TARGET_BYTES + 1), true);
});
