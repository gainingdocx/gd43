import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeBL } from "./testing";
import { extractionSafety } from "./extraction-safety";

describe("extraction safety", () => {
  it("blocks cargo counts that contradict the printed package total", () => {
    const extraction = makeBL({
      total_packages: 750,
      cargo: [
        { packages: 200 },
        { packages: 450 },
        { packages: 550 },
      ],
    });
    const result = extractionSafety(extraction);
    assert.deepEqual(
      result.find((item) => item.rule === "packages.line_sum"),
      {
        field: "total_packages",
        rule: "packages.line_sum",
        status: "fail",
        message: "Cargo-line package counts add to 1200, but the document total is 750. This may be a duplicated parent total or a misread line.",
        expected: "750",
        actual: "1200",
      }
    );
  });

  it("blocks a numeric field that contradicts its own source quote", () => {
    const extraction = makeBL({ total_gross_kg: 15000 });
    extraction.fields._meta.source_evidence = {
      total_gross_kg: { page: 1, quote: "15750.000" },
    };
    const result = extractionSafety(extraction);
    assert.equal(result.find((item) => item.rule === "extraction.numeric_evidence")?.status, "fail");
  });

  it("turns cross-model conflicts into blocking failures", () => {
    const extraction = makeBL({ total_gross_kg: 15750 });
    extraction.fields._meta.confidence_flags = ["cross_model:total_gross_kg"];
    const result = extractionSafety(extraction);
    assert.equal(result[0]?.status, "fail");
  });

  it("blocks an implausible numeric-only B/L identifier", () => {
    const result = extractionSafety(makeBL({ bl_number: "3" }));
    assert.equal(result.find((item) => item.rule === "extraction.bl_number_shape")?.status, "fail");
  });

  it("checks a single cargo line against the printed package total", () => {
    const result = extractionSafety(makeBL({ total_packages: 20, cargo: [{ packages: 280 }] }));
    assert.equal(result.find((item) => item.rule === "packages.line_sum")?.status, "fail");
  });

  it("blocks a result that remains below the release threshold after retry", () => {
    const extraction = makeBL({ bl_number: "COKA04793" });
    extraction.fields._meta.confidence_flags = ["low_quality:71/82"];
    const result = extractionSafety(extraction);
    assert.equal(result.find((item) => item.rule === "extraction.low_quality")?.status, "fail");
  });
});
