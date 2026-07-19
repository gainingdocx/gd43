import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { weights, withinTolerance } from "./weights";
import { container, makeBL, makeCI, makeLine, makePL } from "./testing";

describe("withinTolerance", () => {
  it("±0.5% relative", () => {
    assert.equal(withinTolerance(1000, 1000), true);
    assert.equal(withinTolerance(1000, 1004.9), true);
    assert.equal(withinTolerance(1000, 1006), false);
    assert.equal(withinTolerance(0, 0), true);
  });
});

describe("weights — bill of lading", () => {
  it("passes when container gross sums to the total", () => {
    const r = weights(
      makeBL({
        containers: [container("CSQU3054383", 18000), container("MSKU6856622", 18430)],
        total_gross_kg: 36430,
      })
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [["weights.container_sum", "pass"]]
    );
  });

  it("fails when the sum is off by more than 0.5%", () => {
    const r = weights(
      makeBL({
        containers: [container("CSQU3054383", 18000), container("MSKU6856622", 18430)],
        total_gross_kg: 40000,
      })
    );
    assert.equal(r[0].status, "fail");
    assert.equal(r[0].expected, "40,000");
    assert.equal(r[0].actual, "36,430");
  });

  it("silent when totals or container weights are absent", () => {
    assert.deepEqual(weights(makeBL({ total_gross_kg: 36430 })), []);
    assert.deepEqual(
      weights(makeBL({ containers: [container("CSQU3054383")] })),
      []
    );
  });

  it("flags cargo lines with gross < net", () => {
    const r = weights(
      makeBL({ cargo: [makeLine({ gross_kg: 900, net_kg: 1000 })] })
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status, x.field]),
      [["weights.gross_ge_net", "fail", "cargo[0].gross_kg"]]
    );
  });
});

describe("weights — commercial invoice", () => {
  it("flags line gross < net, ignores complete lines", () => {
    const r = weights(
      makeCI({
        line_items: [
          makeLine({ gross_kg: 500, net_kg: 480 }),
          makeLine({ gross_kg: 100, net_kg: 120 }),
          makeLine({}),
        ],
      })
    );
    assert.deepEqual(
      r.map((x) => [x.status, x.field]),
      [["fail", "line_items[1].gross_kg"]]
    );
  });
});

describe("weights — packing list", () => {
  it("warns (not fails) when line sums drift from totals", () => {
    const r = weights(
      makePL({
        line_items: [
          makeLine({ gross_kg: 100, net_kg: 90 }),
          makeLine({ gross_kg: 200, net_kg: 180 }),
        ],
        total_gross_kg: 400,
        total_net_kg: 270,
      })
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status, x.field]),
      [
        ["weights.line_sum", "warn", "total_gross_kg"],
        ["weights.line_sum", "pass", "total_net_kg"],
      ]
    );
  });

  it("fails when total gross < total net", () => {
    const r = weights(makePL({ total_gross_kg: 900, total_net_kg: 1000 }));
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [["weights.gross_ge_net", "fail"]]
    );
  });

  it("empty packing list produces nothing", () => {
    assert.deepEqual(weights(makePL()), []);
  });
});
