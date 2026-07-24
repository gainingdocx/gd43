import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { translationCandidates } from "./translate";

describe("translation candidate selection", () => {
  it("keeps human text and excludes operational identifiers", () => {
    const values = translationCandidates({
      invoice_no: "INV-7788",
      invoice_date: "23/07/2026",
      seller: { name: "Société Exemple", address: "12 rue de la Paix, Paris" },
      line_items: [{ description: "Pièces de machine en acier", hs_code: "848390" }],
      dangerous_goods: [{ proper_shipping_name: "LIQUIDE INFLAMMABLE", un_number: "UN1993" }],
      _meta: { source_languages: ["fr"] },
    });
    assert.deepEqual(values.map((value) => value.path), [
      "seller.name",
      "seller.address",
      "line_items[0].description",
      "dangerous_goods[0].proper_shipping_name",
    ]);
  });
});
