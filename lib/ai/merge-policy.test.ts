import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evidenceSupports, rowsMatchOwnTotal } from "./merge-policy";

describe("Gemma cross-check policy", () => {
  it("selects only the critical numeric value supported by its source quote", () => {
    const quote = "TOTAL NET 15000.000 KGS GROSS WEIGHT 15750.000 KGS";
    assert.equal(evidenceSupports(quote, 15_750), true);
    assert.equal(evidenceSupports("GROSS WEIGHT 15750.000 KGS", 15_000), false);
  });

  it("matches normalized identifiers against exact source evidence", () => {
    assert.equal(evidenceSupports("B/L NO. COKA04793", "COKA04793"), true);
    assert.equal(evidenceSupports("B/L NO. COKA04793", "COKA06793"), false);
  });

  it("distinguishes coherent cargo rows from duplicated or invented counts", () => {
    const root = { total_packages: 750 };
    assert.equal(rowsMatchOwnTotal([{ packages: 200 }, { packages: 550 }], root), true);
    assert.equal(rowsMatchOwnTotal([{ packages: 200 }, { packages: 450 }, { packages: 550 }], root), false);
  });
});
