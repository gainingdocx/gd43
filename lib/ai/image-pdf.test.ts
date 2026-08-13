import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pageImagesAsOcrPdf } from "./image-pdf";

describe("quality-retry OCR PDF", () => {
  it("wraps supported page images in a transient PDF", async () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const result = await pageImagesAsOcrPdf([{ kind: "image", url: `data:image/png;base64,${png}` }]);
    assert.equal(result?.kind, "pdf");
    assert.match(result?.url ?? "", /^data:application\/pdf;base64,/);
  });

  it("does not fetch or wrap remote and unsupported image URLs", async () => {
    assert.equal(await pageImagesAsOcrPdf([{ kind: "image", url: "https://example.test/page.webp" }]), null);
  });

  it("uses the actual image signature when an upload has a misleading MIME label", async () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const result = await pageImagesAsOcrPdf([{ kind: "image", url: `data:image/jpeg;base64,${png}` }]);
    assert.match(result?.url ?? "", /^data:application\/pdf;base64,/);
  });
});
