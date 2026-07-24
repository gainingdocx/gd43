import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { crossCheck } from "./cross-check";
import { validateDocument } from "./index";
import { makeBL, makeCI } from "./testing";

const dg = (un_number: string, hazard_class: string, packing_group: "I" | "II" | "III") => ({
  un_number,
  proper_shipping_name: "FLAMMABLE LIQUID, N.O.S.",
  hazard_class,
  subsidiary_risk: null,
  packing_group,
  marine_pollutant: null,
  flash_point_c: null,
  emergency_contact: null,
});

describe("dangerous-goods checks", () => {
  it("validates UN number, class and packing group", () => {
    const results = validateDocument(makeBL({ dangerous_goods: [dg("UN 1993", "3", "II")] }));
    assert.equal(results.filter((result) => result.rule.startsWith("dangerous_goods")).length, 3);
    assert.ok(results.filter((result) => result.rule.startsWith("dangerous_goods")).every((result) => result.status === "pass"));
  });

  it("fails malformed UN numbers and missing classes", () => {
    const results = validateDocument(makeBL({ dangerous_goods: [dg("UN19", "", "II")] }));
    assert.equal(results.find((result) => result.rule === "dangerous_goods.un_number")?.status, "fail");
    assert.equal(results.find((result) => result.rule === "dangerous_goods.hazard_class")?.status, "warn");
  });

  it("flags cross-document hazard conflicts red", () => {
    const results = crossCheck([
      { id: "bl", extraction: makeBL({ dangerous_goods: [dg("UN1993", "3", "II")] }) },
      { id: "ci", extraction: makeCI({ dangerous_goods: [dg("1993", "8", "II")] }) },
    ]);
    assert.equal(results.length, 1);
    assert.equal(results[0].severity, "red");
    assert.match(results[0].message, /hazard class conflicts/);
  });
});
