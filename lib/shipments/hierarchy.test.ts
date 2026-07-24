import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { billIdentity, normalizeBillNumber } from "./hierarchy";
import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";

const bl = (fields: Record<string, unknown>) =>
  ({ detected_type: "bill_of_lading", fields } as unknown as NormalizedExtraction);

describe("billIdentity", () => {
  it("keeps a house shipment distinct and links it to its master", () => {
    assert.deepEqual(billIdentity(bl({
      bl_number: "HBL-22", bl_level: "house", master_bl_number: "MBL 100", house_bl_number: null,
    })), {
      level: "house", blNumber: "HBL22", masterBlNumber: "MBL100", houseBlNumber: "HBL22",
    });
  });
  it("does not invent hierarchy for an unknown bill", () => {
    assert.deepEqual(billIdentity(bl({ bl_number: "X-1", bl_level: "unknown" })), {
      level: "standalone", blNumber: "X1", masterBlNumber: null, houseBlNumber: null,
    });
  });
  it("normalizes printed separators", () => assert.equal(normalizeBillNumber(" mbl / 10-2 "), "MBL102"));
});
