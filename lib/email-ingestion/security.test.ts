import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { attachmentMatchesMime, intakeWindowStart, MAX_EMAILS_PER_TEN_MINUTES } from "./security";

describe("email intake security", () => {
  it("accepts real signatures and rejects MIME-spoofed attachments", () => {
    assert.equal(attachmentMatchesMime(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]), "application/pdf"), true);
    assert.equal(attachmentMatchesMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"), true);
    assert.equal(attachmentMatchesMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
    assert.equal(attachmentMatchesMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp"), true);
    assert.equal(attachmentMatchesMime(new TextEncoder().encode("not a pdf"), "application/pdf"), false);
  });

  it("uses a bounded ten-minute abuse window", () => {
    assert.equal(intakeWindowStart(Date.parse("2026-08-03T12:10:00Z")), "2026-08-03T12:00:00.000Z");
    assert.equal(MAX_EMAILS_PER_TEN_MINUTES, 25);
  });
});
